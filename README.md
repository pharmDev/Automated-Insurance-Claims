# Automated Insurance Claims Contract

## Overview

This is a parametric insurance smart contract that automatically processes claims based on predefined conditions. The contract is designed to provide weather-based insurance coverage with automated claim processing when specific conditions are met.

## Key Features

- **Parametric Insurance**: Claims are automatically triggered when predefined conditions are met (e.g., rainfall exceeds 100mm)
- **Multiple Risk Profiles**: Supports different insurance products (drought, flood, hurricane, frost insurance)
- **Oracle Integration**: Uses external data providers (oracles) to verify weather conditions
- **Automated Claims Processing**: Claims are approved and paid automatically when conditions are met
- **Policy Management**: Users can create, renew, and cancel policies
- **Transparent Treasury**: Tracks all premiums collected and claims paid

## Contract Details

### Constants

- **Error Codes**: Standardized error messages for contract operations
- **Policy Statuses**: ACTIVE, EXPIRED, CANCELED, CLAIMED
- **Claim Statuses**: PENDING, APPROVED, REJECTED, PAID
- **Weather Event Types**: RAINFALL, TEMPERATURE, WIND-SPEED, etc.
- **Condition Operators**: GREATER-THAN, LESS-THAN, EQUAL-TO, etc.

### Data Structures

- **Policies**: Stores all insurance policies
- **Claims**: Tracks all claims made against policies
- **Risk Profiles**: Defines different insurance products
- **Oracle Registry**: Lists approved data providers
- **Oracle Data**: Stores weather data from oracles
- **Policy Conditions**: Defines claim triggers for each policy

### Main Functions

1. **Policy Management**:
   - `create-policy`: Purchase a new insurance policy
   - `renew-policy`: Renew an expired policy
   - `cancel-policy`: Cancel an active policy
   - `add-policy-condition`: Define claim triggers for a policy

2. **Claims Processing**:
   - `submit-claim`: Submit a claim when conditions are met
   - `process-claim-payment`: Pay out approved claims

3. **Oracle Management**:
   - `register-oracle`: Add new data providers (admin only)
   - `submit-oracle-data`: Submit weather data (oracle only)

4. **Administration**:
   - `set-risk-profile`: Add/update insurance products (admin only)
   - `transfer-ownership`: Change contract owner (admin only)

## Usage Examples

### Creating a Policy

```clarity
(create-policy 
  u1                  ;; Risk profile ID (Agricultural Drought Insurance)
  u100000000          ;; Coverage amount (1000 STX)
  u52560              ;; Duration (approx 1 year at 10 min/block)
  false               ;; Auto-renew
  "Austin, Texas"     ;; Location
)
```

### Adding a Claim Condition

```clarity
(add-policy-condition
  u1                  ;; Policy ID
  WEATHER-RAINFALL    ;; Weather type
  OPERATOR-LESS-THAN  ;; Condition operator
  u300                ;; Threshold value (300mm)
  u10000              ;; Payout percentage (100%)
  "weather-oracle-1"  ;; Oracle ID
)
```

### Submitting a Claim

```clarity
(submit-claim u1)     ;; Policy ID
```

## Risk Profiles

The contract comes with four predefined risk profiles:

1. **Agricultural Drought Insurance** (ID: 1)
   - Base premium: 5%
   - Coverage multiplier: 10x
   - Min coverage: 100 STX
   - Max coverage: 10,000 STX

2. **Flood Insurance** (ID: 2)
   - Base premium: 7.5%
   - Coverage multiplier: 8x
   - Min coverage: 200 STX
   - Max coverage: 20,000 STX

3. **Hurricane Insurance** (ID: 3)
   - Base premium: 10%
   - Coverage multiplier: 6x
   - Min coverage: 500 STX
   - Max coverage: 50,000 STX

4. **Frost Insurance** (ID: 4)
   - Base premium: 4%
   - Coverage multiplier: 12x
   - Min coverage: 50 STX
   - Max coverage: 5,000 STX

## Security Considerations

- Only the contract owner can register oracles and update risk profiles
- Only the policyholder can modify their policy conditions
- Claims are automatically processed based on oracle data
- All premium payments are tracked in the contract treasury

## License

This contract is provided as-is under the MIT License. Use at your own risk.
