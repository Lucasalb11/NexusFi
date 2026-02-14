# Deployment - NexusFi

## Prerequisites

- Node.js >= 18, pnpm >= 8
- Stellar account and environment (testnet/mainnet)
- (Optional) Chainlink for oracles

## Build

```bash
pnpm install
pnpm build
```

## Production variables

- Set all variables from `.env.example` in the production environment.
- Never commit `.env` or keys.
- Use provider secrets (Vercel, Railway, etc.) for `API_SECRET_KEY`, `SOROBAN_SECRET_KEY`, Chainlink keys.

## Frontend (e.g. Vercel)

- Build command: `pnpm build:frontend` (or `pnpm --filter frontend build`).
- Root directory: `apps/frontend` or configure monorepo in the dashboard.
- Variables: `NEXT_PUBLIC_API_URL` pointing to the backend in production.

## Backend (e.g. Node on VPS/container)

- Run `pnpm --filter backend start` after `pnpm build`.
- Ensure `NODE_ENV=production` and `PORT` are set.

## Soroban contracts

- Build: `cargo build --release --target wasm32-unknown-unknown` in `contracts/nexusfi_token`.
- Deploy via Soroban CLI or project deploy tool, using RPC and network passphrase for the target network.
