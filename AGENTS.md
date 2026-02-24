# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

NexusFi is a decentralized fintech PWA (Next.js 14 frontend + Express backend) on Stellar/Soroban with Chainlink CRE workflows. It's a pnpm monorepo with workspaces at `apps/frontend` and `apps/backend`.

### Running the Application

- `pnpm dev` starts both frontend (:3000) and backend (:3001) in parallel
- `pnpm dev:frontend` / `pnpm dev:backend` to run individually
- Backend uses `tsx watch` for hot-reload; frontend uses `next dev`

### Environment Setup

- Copy `.env.example` files: `cp apps/frontend/.env.example apps/frontend/.env && cp apps/backend/.env.example apps/backend/.env`
- All external API keys (Stellar secret key, MoonPay, Chainlink CRE) are optional for dev — the backend has simulation/fallback modes
- No databases or Docker required — all state is on-chain (Stellar Testnet) or in-memory

### Lint & Test

- `pnpm lint` runs ESLint for both frontend (`next lint`) and backend (`eslint src --ext .ts`)
- `pnpm test` runs vitest in the backend — currently no test files exist (hackathon project), so vitest exits with code 1. This is expected.
- `test-app.mjs` is a Playwright E2E test that requires dev servers running first

### Gotchas

- Next.js emits a cosmetic warning about "lockfile missing swc dependencies" — this does not affect functionality, the app still starts and builds correctly
- The frontend uses passkey-based auth (WebAuthn). In headless/cloud environments, bypass auth by injecting a mock wallet into `localStorage`: `localStorage.setItem("nexusfi_wallet", JSON.stringify({address: "...", keyId: "test"}))`
- Smart contracts (Rust/Soroban in `contracts/`) are pre-deployed on Stellar Testnet — building them requires Rust + `wasm32-unknown-unknown` target + Stellar CLI, which is not needed for frontend/backend development
- CRE workflows (`workflows/cre/`) use Bun and the Chainlink CRE CLI — the backend's `cre-bridge.ts` has a full simulation layer that doesn't depend on real CRE
