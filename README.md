# NexusFi — Decentralized Fintech on Stellar + Chainlink CRE

A **mobile-first PWA** that brings Nubank-style banking to decentralized finance, powered by **Stellar/Soroban** smart contracts, **Chainlink CRE** workflows, **MoonPay** fiat on/off-ramp, and a **cross-chain bridge** (Stellar ↔ Solana / Ethereum / Avalanche).

Built for the [Chainlink Convergence Hackathon](https://chain.link/hackathon) (Feb 6 – Mar 1, 2026).

---

## Hackathon Tracks

NexusFi qualifies for **4 tracks** through 5 integrated CRE workflows:

| Track | Workflow | Description |
|-------|----------|-------------|
| **DeFi & Tokenization** | WF1: Proof of Reserve | nUSD + nBRL stablecoins on Stellar with CRE-verified reserves via Horizon API |
| **CRE & AI** | WF2: AI Credit Scoring | On-chain history analysis via LLM to compute decentralized credit scores |
| **Risk & Compliance** | WF3: Risk Monitor | Automated reserve/utilization/price monitoring with safeguard triggers |
| **Privacy** | WF4: Privacy Credit Check | Confidential HTTP for credit eligibility without exposing credentials on-chain |
| **DeFi & Tokenization + CRE** | WF5: Cross-Chain Bridge | CRE-orchestrated bridge between Stellar, Solana, Ethereum, and Avalanche |

---

## Live Contracts (Stellar Testnet)

All contracts are deployed and initialized on the Stellar Testnet. Every transaction (mint, burn, transfer, bridge, credit score, credit line) is **validated on-chain** with a verifiable transaction hash.

| Contract | Symbol | Contract ID | Explorer |
|----------|--------|-------------|----------|
| NexusFi USD | **nUSD** | `CDUFIUTO6TH5VLDZ7NWIB2P4WZJ4RIMV4Q6FS44V6LSK6R3BA7U4KZUE` | [View](https://stellar.expert/explorer/testnet/contract/CDUFIUTO6TH5VLDZ7NWIB2P4WZJ4RIMV4Q6FS44V6LSK6R3BA7U4KZUE) |
| NexusFi BRL | **nBRL** | `CBDCRA6I4UAHSQWJL2O7XLXD7BHBG24SEA5DNGM56CIGJETMVIKAV3DS` | [View](https://stellar.expert/explorer/testnet/contract/CBDCRA6I4UAHSQWJL2O7XLXD7BHBG24SEA5DNGM56CIGJETMVIKAV3DS) |
| Credit Score | — | `CDALW3URIC7F4NJXNMYV5IQ45F2LNCANJBT4AOWFTTIBE4TYK5JBH77J` | [View](https://stellar.expert/explorer/testnet/contract/CDALW3URIC7F4NJXNMYV5IQ45F2LNCANJBT4AOWFTTIBE4TYK5JBH77J) |
| Credit Line | — | `CAOOW56V4KKK2HNTTXOCL7VXJU7GEFOJLUWCRUYMUNOSHX74TZH7RFJN` | [View](https://stellar.expert/explorer/testnet/contract/CAOOW56V4KKK2HNTTXOCL7VXJU7GEFOJLUWCRUYMUNOSHX74TZH7RFJN) |

---

## Files Using Chainlink

| File | Purpose |
|------|---------|
| [`workflows/cre/main.ts`](workflows/cre/main.ts) | **All 5 CRE workflows** — Proof of Reserve, AI Credit Scoring, Risk Monitor, Privacy Credit Check, Cross-Chain Bridge |
| [`workflows/cre/workflow.yaml`](workflows/cre/workflow.yaml) | CRE workflow configuration (staging/production) |
| [`workflows/cre/project.yaml`](workflows/cre/project.yaml) | CRE project settings (Sepolia RPC) |
| [`workflows/cre/config.staging.json`](workflows/cre/config.staging.json) | Workflow schedule configuration |
| [`apps/backend/src/services/cre-bridge.ts`](apps/backend/src/services/cre-bridge.ts) | Backend bridge to CRE workflows (simulation layer) |
| [`apps/backend/src/services/bridge.ts`](apps/backend/src/services/bridge.ts) | Cross-chain bridge service — burn/verify/mint via CRE orchestration |
| [`apps/backend/src/routes/cre.ts`](apps/backend/src/routes/cre.ts) | API routes exposing CRE workflow results |
| [`apps/backend/src/routes/bridge.ts`](apps/backend/src/routes/bridge.ts) | Cross-chain bridge API routes (quote, execute, status) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Mobile PWA (Next.js)                       │
│  Dashboard │ Wallet │ Credit Card │ Deposit │ Bridge │ Settings
└───────┬────────────────────────────────┬─────────────────────┘
        │ REST API                       │ MoonPay Widget
┌───────┴──────────────────────┐    ┌────┴──────────────────┐
│       Backend (Express)      │    │     MoonPay API       │
│ Stellar│Soroban│CRE│Bridge│MP│    │ PIX│SWIFT│Card│SEPA   │
└─┬──────────┬─────────┬──┬───┘    │ USDC on Stellar       │
  │          │         │  │        └────────┬──────────────┘
  │          │         │  └─── Webhooks ────┘
┌─┴──────┐ ┌┴───────┐ │
│Soroban │ │Stellar │ │
│Contracts│ │Horizon │ │
│        │ │ API    │ │
│• nUSD  │ └────────┘ │
│• nBRL  │      ┌─────┴────────────────────────────┐
│• Score │      │        Chainlink CRE              │
│• Line  │      │ • WF1: Proof of Reserve           │
└────────┘      │ • WF2: AI Credit Scoring          │
                │ • WF3: Risk Monitor               │
                │ • WF4: Privacy Credit Check        │
                │ • WF5: Cross-Chain Bridge          │
                └──┬─────────┬──────────┬───────────┘
            ┌──────┴───┐ ┌───┴──────┐ ┌┴──────────┐
            │ Ethereum │ │  Solana  │ │ Avalanche │
            │ Sepolia  │ │  Devnet  │ │   Fuji    │
            └──────────┘ └──────────┘ └───────────┘
```

---

## Cross-Chain Bridge (Chainlink CRE)

NexusFi uses Chainlink CRE as the trusted orchestration layer for cross-chain token movement.

**Supported Chains:**

| Chain | Network | Bridge Fee |
|-------|---------|-----------|
| Stellar | Testnet | — (home chain) |
| Solana | Devnet | 0.15% |
| Ethereum | Sepolia | 0.25% |
| Avalanche | Fuji | 0.20% |

**Bridge Flow (Stellar → Solana example):**

1. User requests bridge of 100 nUSD from Stellar to Solana
2. Backend **burns 100 nUSD** on Stellar (real on-chain transaction)
3. CRE WF5 **verifies the burn** on Horizon API (consensus across nodes)
4. CRE generates a signed **attestation hash**
5. CRE **authorizes mint** of 99.85 nUSD on Solana (minus 0.15% fee)
6. Bridge receipt returned with both transaction hashes

**Reverse Flow (Solana → Stellar):**

1. CRE verifies lock/burn on Solana RPC
2. CRE generates attestation
3. Backend **mints nUSD on Stellar** (real on-chain transaction)

Both nUSD and nBRL can be bridged across all supported chains.

---

## Fiat On-Ramp / Off-Ramp (MoonPay)

NexusFi uses [MoonPay](https://www.moonpay.com) for fiat-to-crypto and crypto-to-fiat:

| Method | On-Ramp | Off-Ramp | Currency | Region |
|--------|---------|----------|----------|--------|
| **PIX** | Yes | Yes | BRL | Brazil |
| **SWIFT / Wire** | Yes | Yes | USD | Global |
| **Card** | Yes | — | USD | Global |
| **SEPA** | Yes | Yes | EUR | Europe |

**Flow:**
1. User selects payment method (PIX, SWIFT, Card, SEPA)
2. Backend generates a signed MoonPay widget URL (secret key never exposed)
3. MoonPay widget opens in-app (iframe) for KYC + payment
4. MoonPay sends USDC to user's Stellar wallet
5. CRE WF1 (Proof of Reserve) verifies USDC reserves
6. Backend mints nUSD or nBRL 1:1 against USDC reserve

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion, PWA |
| Backend | Node.js, Express, TypeScript |
| Smart Contracts | Soroban (Rust) on Stellar — 4 contracts deployed |
| Workflows | Chainlink CRE SDK (TypeScript → WASM) — 5 workflows |
| On/Off-Ramp | MoonPay (PIX, SWIFT, Card, SEPA → USDC on Stellar) |
| Cross-Chain | Chainlink CRE bridge (Stellar ↔ Solana / Ethereum / Avalanche) |
| Blockchain | Stellar Testnet, Solana Devnet, Ethereum Sepolia, Avalanche Fuji |

---

## Monorepo Structure

```
NexusFi/
├── apps/
│   ├── frontend/              # Next.js 14 PWA (mobile-first)
│   │   └── src/
│   │       ├── app/           # Pages (dashboard, wallet, credit, deposit)
│   │       ├── components/    # Shared UI (BalanceCard, CreditCard, etc.)
│   │       └── lib/           # API client, formatters, hooks
│   └── backend/               # Express API server
│       └── src/
│           ├── routes/        # wallet, credit, deposit, bridge, cre
│           ├── services/      # stellar, soroban, tokens, bridge, cre-bridge, moonpay
│           └── middleware/    # auth
├── contracts/                 # Soroban smart contracts (Rust)
│   ├── nexusfi_token/         # nUSD + nBRL stablecoin (SEP-41)
│   ├── credit_score/          # AI credit score storage
│   └── credit_line/           # Credit card logic
├── workflows/
│   └── cre/                   # Chainlink CRE workflows
│       └── main.ts            # All 5 workflows
├── docs/                      # Technical documentation
└── scripts/                   # Security scripts (pre-commit secret scanning)
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Rust + `wasm32-unknown-unknown` target (for contracts)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (for contract deployment)
- [CRE CLI](https://docs.chain.link/cre/getting-started/overview) (for workflow simulation)

### Setup

```bash
# Clone and install
git clone https://github.com/your-org/nexusfi.git
cd nexusfi
pnpm install

# Configure environment
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your keys (see .env.example for all variables)

# Run development servers
pnpm dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:3001`.

### Smart Contracts

```bash
cd contracts

# Build all contracts (nUSD, nBRL, credit_score, credit_line)
cargo build --target wasm32-unknown-unknown --release

# Generate a deployer keypair
stellar keys generate deployer --network testnet

# Deploy each contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source deployer --network testnet

# Initialize (example for nUSD)
stellar contract invoke --id <CONTRACT_ID> --source deployer --network testnet \
  -- initialize --admin <DEPLOYER_PUBLIC_KEY> --name "NexusFi USD" --symbol "nUSD" --decimals 7

# Deploy a second instance for nBRL
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source deployer --network testnet

stellar contract invoke --id <NBRL_CONTRACT_ID> --source deployer --network testnet \
  -- initialize --admin <DEPLOYER_PUBLIC_KEY> --name "NexusFi BRL" --symbol "nBRL" --decimals 7
```

### CRE Workflows

```bash
cd workflows/cre
bun install

# Simulate all 5 workflows
cre workflow simulate --workflow-file workflow.yaml --target staging
```

### Install PWA

Open `http://localhost:3000` on your phone's browser and tap "Add to Home Screen".

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| **Wallet** | | |
| GET | `/api/wallet/balance` | Multi-token balance (nUSD, nBRL, XLM) — reads from on-chain contracts |
| GET | `/api/wallet/account` | Stellar account details |
| GET | `/api/wallet/transactions` | Transaction history from Horizon |
| POST | `/api/wallet/send` | Transfer nUSD or nBRL (real on-chain transaction) |
| POST | `/api/wallet/fund-testnet` | Fund account via Friendbot |
| **Credit** | | |
| GET | `/api/credit/score` | AI credit score — computed and written on-chain (CRE WF2) |
| GET | `/api/credit/info` | Credit line details — read from on-chain contract |
| POST | `/api/credit/open` | Open a credit line based on on-chain score |
| POST | `/api/credit/use` | Use credit (real on-chain transaction) |
| POST | `/api/credit/repay` | Repay credit (real on-chain transaction) |
| **Deposit / Withdraw** | | |
| GET | `/api/deposit/config` | MoonPay config + available payment methods |
| POST | `/api/deposit/buy-url` | Signed MoonPay buy widget URL (PIX/SWIFT/Card) |
| POST | `/api/deposit/sell-url` | Signed MoonPay sell widget URL (off-ramp) |
| POST | `/api/deposit/webhook` | MoonPay webhook — triggers real on-chain mint/burn |
| POST | `/api/deposit/mint` | Mint nUSD or nBRL (real on-chain transaction) |
| POST | `/api/deposit/withdraw` | Burn nUSD or nBRL (real on-chain transaction) |
| **Cross-Chain Bridge** | | |
| GET | `/api/bridge/chains` | List supported chains (Stellar, Solana, Ethereum, Avalanche) |
| POST | `/api/bridge/quote` | Get bridge quote (fee, estimated time) |
| POST | `/api/bridge/execute` | Execute bridge — burn on source, CRE verify, mint on dest |
| GET | `/api/bridge/status/:id` | Check bridge transaction status |
| **CRE Workflows** | | |
| GET | `/api/cre/status` | All workflow statuses |
| GET | `/api/cre/proof-of-reserve` | Reserve attestation (WF1) |
| GET | `/api/cre/credit-score` | Credit score result (WF2) |
| GET | `/api/cre/risk` | Risk metrics (WF3) |
| GET | `/api/cre/privacy-check` | Privacy eligibility (WF4) |

---

## Security

- **Secrets**: All credentials stored in `.env` files (gitignored). Pre-commit hook scans for leaked secrets using gitleaks patterns.
- **Frontend**: Never receives private keys. Only `NEXT_PUBLIC_*` variables exposed.
- **Backend**: Validates environment on startup via `validate-env.ts`. Refuses to start in production without required secrets.
- **CRE**: Workflow secrets via `secrets.yaml` (gitignored). Confidential HTTP for sensitive API calls.
- **Contracts**: `require_auth()` on all state-changing operations. Admin-only minting and score writing.
- **MoonPay**: `MOONPAY_SECRET_KEY` stays server-side only (URL signing). Webhook callbacks verified with HMAC-SHA256.
- **Bridge**: CRE attestation hash required before any cross-chain mint. Burns verified on-chain before authorizing mints.

---

## License

MIT
