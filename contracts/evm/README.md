# NexusFi — Sepolia Attestation Contracts

Solidity contracts deployed on Ethereum Sepolia that receive attestations from Chainlink CRE workflows.

## Contracts

| Contract | Purpose | CRE Workflow |
|----------|---------|--------------|
| `ReserveAttestation.sol` | Proof of Reserve on-chain record | WF1 |
| `CreditScoreAttestation.sol` | AI credit score storage | WF2 |
| `RiskReport.sol` | Protocol risk metrics + alerts | WF3 |
| `PrivacyCreditCheck.sol` | Privacy-preserving eligibility | WF4 |

All contracts accept writes **only from the Chainlink CRE Forwarder**:
```
0x15fc6ae953e024d975e77382eeec56a9101f9f88
```

## Setup

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install foundry-rs/forge-std

# Build
forge build

# Test
forge test -v

# Deploy to Sepolia
cp .env.example .env
# Fill in SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

## Architecture

```
Chainlink CRE DON
       │
       │  (consensus + signed report)
       ▼
CRE Forwarder (0x15fc...)
       │
       ├──► ReserveAttestation.updateReserves()
       ├──► CreditScoreAttestation.updateScore()
       ├──► RiskReport.updateRisk()
       └──► PrivacyCreditCheck.recordEligibility()
```

## Privacy Design (WF4)

`PrivacyCreditCheck.sol` stores only `keccak256(userId)` and a boolean.
The raw credit data, API credentials, and user PII never appear on-chain.
The CRE workflow processes them inside a Trusted Execution Environment (TEE)
using `ConfidentialHTTPClient`.
