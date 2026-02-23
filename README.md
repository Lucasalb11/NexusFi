# NexusFi — Decentralized Fintech on Stellar + Chainlink CRE

A **mobile-first PWA** that brings Nubank-style banking to decentralized finance, powered by **Stellar/Soroban** smart contracts, **Chainlink CRE** workflows, and **MoonPay** fiat on/off-ramp (PIX, SWIFT, Card, SEPA).

Built for the [Chainlink Convergence Hackathon](https://chain.link/hackathon) (Feb 6 – Mar 1, 2026).

---

## Hackathon Tracks

NexusFi qualifies for **4 tracks** through integrated CRE workflows:

| Track | Workflow | Description |
|-------|----------|-------------|
| **DeFi & Tokenization** | WF1: Proof of Reserve | nUSD stablecoin on Stellar with CRE-verified reserves via Horizon API + MoonPay on-ramp |
| **CRE & AI** | WF2: AI Credit Scoring | On-chain history analysis via LLM to compute decentralized credit scores |
| **Risk & Compliance** | WF3: Risk Monitor | Automated reserve/utilization/price monitoring with safeguard triggers |
| **Privacy** | WF4: Privacy Credit Check | Confidential HTTP for credit eligibility without exposing credentials on-chain |

---

## Files Using Chainlink

| File | Purpose |
|------|---------|
| [`workflows/cre/main.ts`](workflows/cre/main.ts) | **All 4 CRE workflows** — Proof of Reserve, AI Credit Scoring, Risk Monitor, Privacy Credit Check |
| [`workflows/cre/workflow.yaml`](workflows/cre/workflow.yaml) | CRE workflow configuration (staging/production) |
| [`workflows/cre/project.yaml`](workflows/cre/project.yaml) | CRE project settings (Sepolia RPC) |
| [`workflows/cre/config.staging.json`](workflows/cre/config.staging.json) | Workflow schedule configuration |
| [`apps/backend/src/services/cre-bridge.ts`](apps/backend/src/services/cre-bridge.ts) | Backend bridge to CRE workflows (simulation layer) |
| [`apps/backend/src/routes/cre.ts`](apps/backend/src/routes/cre.ts) | API routes exposing CRE workflow results |
| [`apps/backend/src/services/moonpay.ts`](apps/backend/src/services/moonpay.ts) | MoonPay integration (URL signing, webhook verification) |
| [`apps/backend/src/routes/deposit.ts`](apps/backend/src/routes/deposit.ts) | Deposit/withdraw routes with MoonPay on/off-ramp |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile PWA (Next.js)                   │
│  Dashboard │ Wallet │ Credit Card │ Deposit │ Settings   │
└──────────────┬─────────────────────────┬────────────────┘
               │ REST API               │ MoonPay Widget
┌──────────────┴─────────────────┐  ┌───┴────────────────┐
│        Backend (Express)       │  │     MoonPay API     │
│  Stellar │ Soroban │ CRE │ MP │  │  PIX │ SWIFT │ Card │
└──┬───────────┬─────────┬──┬───┘  │  SEPA │ USDC on XLM │
   │           │         │  │      └─────────┬───────────┘
┌──┴────┐  ┌──┴──────┐  │  └──── Webhooks ──┘
│Soroban│  │ Stellar │  │
│       │  │ Horizon │  │
│• nUSD │  │  API    │  │
│• Score│  └─────────┘  │
│• Line │        ┌──────┴──────────┐
└───────┘        │ Chainlink CRE   │
                 │ • WF1: PoR      │
                 │ • WF2: AI Score │
                 │ • WF3: Risk     │
                 │ • WF4: Privacy  │
                 └──────┬──────────┘
                 ┌──────┴──────────┐
                 │ Ethereum Sepolia │
                 │ (attestations)   │
                 └─────────────────┘
```

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
6. Backend mints nUSD 1:1 against USDC reserve

**Security:**
- `MOONPAY_SECRET_KEY` stays server-side only, used for URL signing
- `MOONPAY_WEBHOOK_KEY` verifies webhook callbacks with HMAC-SHA256
- Widget URL is signed to prevent parameter tampering

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Smart Contracts | Soroban (Rust) on Stellar |
| Workflows | Chainlink CRE SDK (TypeScript → WASM) |
| On/Off-Ramp | MoonPay (PIX, SWIFT, Card, SEPA → USDC on Stellar) |
| Blockchain | Stellar Testnet + Ethereum Sepolia |

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
│           ├── routes/        # wallet, credit, deposit, cre
│           ├── services/      # stellar, soroban, cre-bridge
│           └── middleware/     # auth
├── contracts/                 # Soroban smart contracts (Rust)
│   ├── nexusfi_token/         # nUSD stablecoin (SEP-41)
│   ├── credit_score/          # AI credit score storage
│   └── credit_line/           # Credit card logic
├── workflows/
│   └── cre/                   # Chainlink CRE workflows
│       └── main.ts            # All 4 workflows
├── docs/                      # Technical documentation
└── scripts/                   # Security scripts
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
cp .env.example .env
# Edit .env with your keys

# Run development servers (frontend + backend)
pnpm dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:3001`.

### Smart Contracts

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release

# Deploy to Stellar testnet
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source <YOUR_KEY> --network testnet
```

### CRE Workflows

```bash
cd workflows/cre
bun install

# Simulate all workflows
cre workflow simulate --workflow-file workflow.yaml --target staging
```

### Install PWA

Open `http://localhost:3000` on your phone's browser and tap "Add to Home Screen".

---

## Security

- **Secrets**: All credentials in `.env` files (gitignored). Pre-commit hook scans for leaked secrets.
- **Frontend**: Never receives private keys. Only `NEXT_PUBLIC_*` variables exposed.
- **Backend**: Validates environment on startup. Refuses to start in production without required secrets.
- **CRE**: Workflow secrets via `secrets.yaml` (gitignored). Confidential HTTP for sensitive API calls.
- **Contracts**: `require_auth()` on all state-changing operations. Admin-only minting.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/wallet/balance` | Get nUSD balance |
| GET | `/api/wallet/transactions` | Transaction history |
| POST | `/api/wallet/send` | Send nUSD |
| GET | `/api/credit/score` | AI credit score (CRE WF2) |
| GET | `/api/credit/info` | Credit line details |
| GET | `/api/deposit/config` | MoonPay config + available methods |
| POST | `/api/deposit/buy-url` | Signed MoonPay buy widget URL (PIX/SWIFT/Card) |
| POST | `/api/deposit/sell-url` | Signed MoonPay sell widget URL (off-ramp) |
| POST | `/api/deposit/webhook` | MoonPay webhook (tx completion) |
| POST | `/api/deposit/mint` | Demo: direct mint nUSD |
| POST | `/api/deposit/withdraw` | Demo: direct burn nUSD |
| GET | `/api/cre/status` | All workflow statuses |
| GET | `/api/cre/proof-of-reserve` | Reserve attestation (WF1) |
| GET | `/api/cre/risk` | Risk metrics (WF3) |
| GET | `/api/cre/privacy-check` | Privacy eligibility (WF4) |

---

## License

MIT
