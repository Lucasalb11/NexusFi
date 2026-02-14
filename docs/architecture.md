# Architecture - NexusFi

## Overview

NexusFi is a monorepo that groups:

| Layer       | Stack           | Description                          |
|-------------|-----------------|--------------------------------------|
| **Frontend** | Next.js 14     | Web UI (App Router, React)           |
| **Backend**  | Node.js + Express | REST API and orchestration       |
| **Contracts** | Soroban (Rust) | Smart contracts on Stellar          |
| **Workflows** | CRE / scripts  | Chainlink integration and pipelines |

## Data flow

```
[Browser] <-> [Next.js] <-> [Backend API] <-> [Soroban RPC / Chainlink]
                    |
                    v
              [Soroban Contracts]
```

## Configuration

- **Development:** Local `.env` (never committed), `NODE_ENV=development`.
- **Production:** Variables in host/CI environment; separate URLs and keys per environment.

## Security

- Secrets only in environment variables.
- Backend validates and signs sensitive operations; frontend never receives private keys.
- Contracts follow Soroban best practices (checks-effects-interactions, restricted access).
