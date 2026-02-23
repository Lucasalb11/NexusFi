# Architecture — NexusFi

## Overview

NexusFi is a decentralized fintech (Nubank-style) built as a monorepo:

| Layer | Stack | Description |
|-------|-------|-------------|
| **Frontend** | Next.js 14 (PWA) | Mobile-first banking UI |
| **Backend** | Node.js + Express | REST API, Stellar/Soroban integration |
| **Contracts** | Soroban (Rust) | nUSD token, credit score, credit line |
| **Workflows** | Chainlink CRE | 4 workflows across 4 hackathon tracks |

## Data Flow

```
[Mobile PWA] <-> [Backend API] <-> [Soroban Contracts on Stellar]
                      |
                      v
              [CRE Workflows] --> [Stellar Horizon API]
                      |              [Price Feeds]
                      |              [LLM APIs]
                      v
              [Ethereum Sepolia] (attestations)
```

## CRE Workflow Architecture

Each workflow integrates Stellar with external data sources via CRE:

1. **WF1 (DeFi)**: Cron → HTTP(Horizon + CoinGecko) → Compute PoR → EVM Write
2. **WF2 (AI)**: Cron → HTTP(Horizon) → HTTP(LLM) → Credit Score → EVM Write
3. **WF3 (Risk)**: Cron → HTTP(Horizon + Prices) → Risk Metrics → EVM Alert
4. **WF4 (Privacy)**: Cron → Confidential HTTP → Encrypted Result → EVM Write

## Smart Contracts

- **nexusfi_token**: SEP-41 stablecoin with admin-only mint/burn
- **credit_score**: AI credit scores (0-1000) written by CRE/admin
- **credit_line**: Score-based credit limits with use/repay logic

## Security

- Secrets only in `.env` files (gitignored)
- Pre-commit hook scans for leaked credentials
- Backend validates env on startup; refuses to start in production without keys
- Frontend never receives private keys
- CRE workflows use secrets.yaml (gitignored) for credentials
- Contracts enforce `require_auth()` on all writes
