;; Automated Insurance Claims
;; A parametric insurance contract that automatically processes claims based on predefined conditions

;; Constants for errors
(define-constant ERR-NOT-AUTHORIZED u1)
(define-constant ERR-POLICY-NOT-FOUND u2)
(define-constant ERR-POLICY-EXPIRED u3)
(define-constant ERR-POLICY-NOT-ACTIVE u4)
(define-constant ERR-INSUFFICIENT-PAYMENT u5)
(define-constant ERR-INVALID-RISK-PROFILE u6)
(define-constant ERR-INVALID-COVERAGE-AMOUNT u7)
(define-constant ERR-ALREADY-CLAIMED u8)
(define-constant ERR-CLAIM-NOT-FOUND u9)
(define-constant ERR-INVALID-ORACLE-DATA u10)
(define-constant ERR-CLAIM-CONDITION-NOT-MET u11)
(define-constant ERR-ORACLE-NOT-REGISTERED u12)
(define-constant ERR-NO-ORACLE-DATA u13)
(define-constant ERR-INVALID-PARAMETERS u14)
(define-constant ERR-NOT-CLAIMABLE-YET u15)
(define-constant ERR-PAYMENT-FAILED u16)

;; Constants for policy status
(define-constant POLICY-STATUS-ACTIVE u1)
(define-constant POLICY-STATUS-EXPIRED u2)
(define-constant POLICY-STATUS-CANCELED u3)
(define-constant POLICY-STATUS-CLAIMED u4)

;; Constants for claim status
(define-constant CLAIM-STATUS-PENDING u1)
(define-constant CLAIM-STATUS-APPROVED u2)
(define-constant CLAIM-STATUS-REJECTED u3)
(define-constant CLAIM-STATUS-PAID u4)

;; Constants for weather event types
(define-constant WEATHER-RAINFALL u1)
(define-constant WEATHER-TEMPERATURE u2)
(define-constant WEATHER-WIND-SPEED u3)
(define-constant WEATHER-HUMIDITY u4)
(define-constant WEATHER-HURRICANE u5)
(define-constant WEATHER-FLOOD u6)
(define-constant WEATHER-DROUGHT u7)

;; Constants for condition operators
(define-constant OPERATOR-GREATER-THAN u1)
(define-constant OPERATOR-LESS-THAN u2)
(define-constant OPERATOR-EQUAL-TO u3)
(define-constant OPERATOR-GREATER-THAN-OR-EQUAL u4)
(define-constant OPERATOR-LESS-THAN-OR-EQUAL u5)

;; Data variables
(define-data-var contract-owner principal tx-sender)
(define-data-var next-policy-id uint u1)
(define-data-var next-claim-id uint u1)
(define-data-var treasury-balance uint u0)
(define-data-var total-premiums-collected uint u0)
(define-data-var total-claims-paid uint u0)

;; Maps for oracles
(define-map oracle-registry
  { oracle-id: (string-ascii 36) }
  {
    oracle-principal: principal,
    oracle-name: (string-utf8 100),
    oracle-type: uint,
    is-active: bool,
    registration-block: uint
  }
)

;; Maps for oracle data
(define-map oracle-data
  { oracle-id: (string-ascii 36), block-height: uint }
  {
    weather-type: uint,
    location: (string-utf8 100),
    value: uint,
    timestamp: uint
  }
)

;; Maps for risk profiles
(define-map risk-profiles
  { profile-id: uint }
  {
    profile-name: (string-utf8 100),
    base-premium-rate: uint,  ;; basis points (1/100 of 1%)
    coverage-multiplier: uint, ;; multiplier for coverage calculation
    risk-factor: uint,  ;; additional risk factor (basis points)
    min-coverage: uint,
    max-coverage: uint,
    description: (string-utf8 500)
  }
)

;; Maps for policies
(define-map policies
  { policy-id: uint }
  {
    policyholder: principal,
    risk-profile-id: uint,
    coverage-amount: uint,
    premium-amount: uint,
    start-block: uint,
    end-block: uint,
    policy-status: uint,
    renewal-count: uint,
    auto-renew: bool,
    location: (string-utf8 100),
    created-at: uint,
    last-updated: uint
  }
)

;; Maps for policy conditions (claim triggers)
(define-map policy-conditions
  { policy-id: uint, condition-index: uint }
  {
    weather-type: uint,
    operator: uint,
    threshold-value: uint,
    payout-percentage: uint, ;; percentage of coverage to pay out (basis points)
    oracle-id: (string-ascii 36)
  }
)

;; Maps for claims
(define-map claims
  { claim-id: uint }
  {
    policy-id: uint,
    claimant: principal,
    claim-status: uint,
    claim-amount: uint,
    weather-event-type: uint,
    weather-event-value: uint,
    condition-index: uint,
    submitted-block: uint,
    processed-block: (optional uint),
    paid-block: (optional uint),
    oracle-data-block: uint
  }
)

;; Maps for claim history by policy
(define-map policy-claims
  { policy-id: uint, claim-index: uint }
  { claim-id: uint }
)

;; Maps for policy count by user
(define-map user-policy-count
  { user: principal }
  { count: uint }
)

;; Maps for policy indices by user
(define-map user-policies
  { user: principal, index: uint }
  { policy-id: uint }
)

;; Initialize common risk profiles
(begin
  ;; Agricultural drought insurance
  (map-set risk-profiles 
    { profile-id: u1 } 
    {
      profile-name: "Agricultural Drought Insurance",
      base-premium-rate: u500, ;; 5%
      coverage-multiplier: u1000, ;; 10x
      risk-factor: u300, ;; 3%
      min-coverage: u10000000, ;; 100 STX
      max-coverage: u1000000000, ;; 10,000 STX
      description: "Insurance for farmers against drought conditions"
    }
  )
  
  ;; Flood insurance
  (map-set risk-profiles 
    { profile-id: u2 } 
    {
      profile-name: "Flood Insurance",
      base-premium-rate: u750, ;; 7.5%
      coverage-multiplier: u800, ;; 8x
      risk-factor: u500, ;; 5%
      min-coverage: u20000000, ;; 200 STX
      max-coverage: u2000000000, ;; 20,000 STX
      description: "Insurance against flood damage"
    }
  )
  
  ;; Hurricane insurance
  (map-set risk-profiles 
    { profile-id: u3 } 
    {
      profile-name: "Hurricane Insurance",
      base-premium-rate: u1000, ;; 10%
      coverage-multiplier: u600, ;; 6x
      risk-factor: u800, ;; 8%
      min-coverage: u50000000, ;; 500 STX
      max-coverage: u5000000000, ;; 50,000 STX
      description: "Insurance against hurricane damage"
    }
  )