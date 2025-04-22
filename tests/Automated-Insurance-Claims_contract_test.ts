;; Test script for NFT-Collateralized Lending Protocol
;; Run with `clarity-cli test /path/to/test-script.clar`

;; Import the main contract
(contract-call? .nft-lending-protocol initialize 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)

;; Test utilities
(define-constant test-address-1 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant test-address-2 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
(define-constant test-address-3 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC)
(define-constant test-appraiser-1 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB)
(define-constant test-appraiser-2 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0)
(define-constant test-appraiser-3 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP)

(define-constant test-nft-contract 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.test-nft)

;; Helper for testing expected results
(define-private (test-result (actual (response bool uint)) (expected-error (optional uint)))
  (if (is-some expected-error)
    (and (is-err actual) (is-eq (unwrap-err actual) (unwrap-panic expected-error)))
    (is-ok actual)
  )
)

;; Test setup
(print "Setting up test environment...")

;; Test 1: Register a new collection
(print "Test 1: Register a new collection")
(let ((result (contract-call? .nft-lending-protocol register-collection 
               "test-collection-1" 
               test-nft-contract
               "https://example.com/api/nft/"
               u5000  ;; 50% max LTV
               u500   ;; 5% min interest rate
               u2000  ;; 20% max interest rate
               "linear"
               (list "Common" "Uncommon" "Rare" "Epic" "Legendary")
               u1000000 ;; Min value 1M tokens
               u100000000 ;; Max value 100M tokens
               )))
  (asserts! (is-ok result) (err "Failed to register collection"))
  (print "✓ Collection registered successfully")
)

;; Test 2: Authorize appraisers
(print "Test 2: Authorize appraisers")
(let ((result-1 (contract-call? .nft-lending-protocol authorize-appraiser
                test-appraiser-1
                (list "test-collection-1")))
      (result-2 (contract-call? .nft-lending-protocol authorize-appraiser
                test-appraiser-2
                (list "test-collection-1")))
      (result-3 (contract-call? .nft-lending-protocol authorize-appraiser
                test-appraiser-3
                (list "test-collection-1"))))
  (asserts! (and (is-ok result-1) (is-ok result-2) (is-ok result-3)) 
            (err "Failed to authorize appraisers"))
  (print "✓ Appraisers authorized successfully")
)
;; Test 3: Test appraisal workflow
(print "Test 3: Testing appraisal workflow")

;; 3.1 Request an appraisal
(print "3.1: Request an appraisal")
(let ((result (as-contract (contract-call? .nft-lending-protocol request-appraisal
                          "test-collection-1"
                          u1))))
  (asserts! (is-ok result) (err "Failed to request appraisal"))
  (let ((request-id (unwrap-panic result)))
    (print (concat "✓ Appraisal requested with ID: " (to-string request-id)))
    
    ;; 3.2 Submit appraisals from all appraisers
    (print "3.2: Submit appraisals")
    (let ((result-1 (contract-call? .nft-lending-protocol submit-appraisal request-id u10000000 tx-sender test-appraiser-1))
          (result-2 (contract-call? .nft-lending-protocol submit-appraisal request-id u11000000 tx-sender test-appraiser-2))
          (result-3 (contract-call? .nft-lending-protocol submit-appraisal request-id u12000000 tx-sender test-appraiser-3)))
      (asserts! (and (is-ok result-1) (is-ok result-2) (is-ok result-3)) 
                (err "Failed to submit appraisals"))
      (print "✓ Appraisals submitted successfully")
      
      ;; 3.3 Check if appraisal was finalized
      (print "3.3: Verify appraisal finalization")
      (let ((appraisal-request (contract-call? .nft-lending-protocol get-appraisal-request request-id)))
        (asserts! (is-ok appraisal-request) (err "Failed to get appraisal request"))
        (let ((request-data (unwrap-panic appraisal-request)))
          (asserts! (is-eq (get status request-data) "completed") 
                    (err "Appraisal was not finalized"))
          (asserts! (is-some (get final-value request-data)) 
                    (err "Appraisal has no final value"))
          (print (concat "✓ Appraisal finalized with value: " 
                 (to-string (unwrap-panic (get final-value request-data)))))
        )
      )
    )
  )
)

;; Test 4: Apply for a loan
(print "Test 4: Apply for a loan")
(let ((result (contract-call? .nft-lending-protocol apply-for-loan
              "test-collection-1"
              u1
              u5000000  ;; 5M tokens (50% of appraised value)
              u1440     ;; 10 day duration (144 blocks per day)
              )))
  (asserts! (is-ok result) (err "Failed to apply for loan"))
  (let ((loan-id (unwrap-panic result)))
    (print (concat "✓ Loan created with ID: " (to-string loan-id)))
    
    ;; 4.1 Check loan details
    (print "4.1: Verify loan details")
    (let ((loan-details (contract-call? .nft-lending-protocol get-loan loan-id)))
      (asserts! (is-ok loan-details) (err "Failed to get loan details"))
      (let ((loan-data (unwrap-panic loan-details)))
        (asserts! (is-eq (get state loan-data) u0) (err "Loan state is not active"))
        (asserts! (is-eq (get borrower loan-data) tx-sender) 
                  (err "Loan borrower doesn't match"))
        (print (concat "✓ Loan verified with amount: " 
               (to-string (get loan-amount loan-data))
               " and interest rate: "
               (to-string (get interest-rate loan-data))))
      )
    )
  )
)