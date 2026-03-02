# NexusFi — Decentralized Fintech on Stellar + Chainlink CRE

A **mobile-first PWA** that brings Nubank-style banking to decentralized finance, powered by **Stellar/Soroban** smart contracts, **Chainlink CRE** workflows, **MoonPay** fiat on/off-ramp, and a **cross-chain bridge** (Stellar ↔ Solana / Ethereum / Avalanche).

Built for the [Chainlink Convergence Hackathon](https://chain.link/hackathon) (Feb 6 – Mar 8, 2026).

---

## Hackathon Tracks

NexusFi qualifies for **4 tracks** through 5 integrated CRE workflows:

| Track | Prize | Workflow | Description |
|-------|-------|----------|-------------|
| **DeFi & Tokenization** | $20K | WF1: Proof of Reserve | nUSD + nBRL stablecoins on Stellar with CRE-verified reserves via Horizon API |
| **CRE & AI** | $16K | WF2: AI Credit Scoring | On-chain history analysis via LLM to compute decentralized credit scores |
| **Risk & Compliance** | $16K | WF3: Risk Monitor | Automated reserve/utilization/price monitoring with safeguard triggers |
| **Privacy** | $16K | WF4: Privacy Credit Check | Confidential HTTP for credit eligibility without exposing credentials on-chain |
| **DeFi + CRE** | — | WF5: Cross-Chain Bridge | CRE-orchestrated bridge between Stellar, Solana, Ethereum, and Avalanche |

---

## Files Using Chainlink

> Every file that directly imports or interacts with the Chainlink CRE SDK or CRE infrastructure:

| File | Purpose |
|------|---------|
| [`workflows/cre/main.ts`](workflows/cre/main.ts) | **All 5 CRE workflows** — Proof of Reserve, AI Credit Scoring, Risk Monitor, Privacy Credit Check, Cross-Chain Bridge. Compiled to WASM and executed by the Chainlink DON. |
| [`workflows/cre/workflow.yaml`](workflows/cre/workflow.yaml) | CRE workflow declaration — links `main.ts` to staging/production config files |
| [`workflows/cre/project.yaml`](workflows/cre/project.yaml) | CRE project settings — Sepolia RPC endpoint for EVM attestation writes |
| [`workflows/cre/config.staging.json`](workflows/cre/config.staging.json) | Workflow config: cron schedule, Stellar reserve address, bridge watch address |
| [`workflows/cre/config.production.json`](workflows/cre/config.production.json) | Production config with tighter schedule (every 5 min) |
| [`workflows/cre/secrets.yaml.example`](workflows/cre/secrets.yaml.example) | Template for CRE secrets: `CREDIT_API_KEY`, `GEMINI_API_KEY` (injected via `runtime.getSecret()`) |
| [`contracts/evm/src/ReserveAttestation.sol`](contracts/evm/src/ReserveAttestation.sol) | Sepolia — receives WF1 attestations; `onlyForwarder` from CRE DON |
| [`contracts/evm/src/CreditScoreAttestation.sol`](contracts/evm/src/CreditScoreAttestation.sol) | Sepolia — receives WF2 credit scores; stores per-user score history on-chain |
| [`contracts/evm/src/RiskReport.sol`](contracts/evm/src/RiskReport.sol) | Sepolia — receives WF3 risk reports; emits `AlertRaised`/`AlertCleared` events |
| [`contracts/evm/src/PrivacyCreditCheck.sol`](contracts/evm/src/PrivacyCreditCheck.sol) | Sepolia — receives WF4 eligibility; stores only `keccak256(userId)` — zero PII on-chain |
| [`contracts/evm/script/Deploy.s.sol`](contracts/evm/script/Deploy.s.sol) | Foundry deploy script — deploys all 4 attestation contracts with CRE Forwarder address |
| [`apps/backend/src/services/cre-bridge.ts`](apps/backend/src/services/cre-bridge.ts) | Backend bridge to CRE workflows (simulation layer for demo) |
| [`apps/backend/src/routes/cre.ts`](apps/backend/src/routes/cre.ts) | API routes exposing CRE workflow results (`/api/cre/*`) |
| [`apps/backend/src/routes/bridge.ts`](apps/backend/src/routes/bridge.ts) | Cross-chain bridge routes — quote, execute, status (backed by CRE WF5) |
| [`apps/backend/src/services/bridge.ts`](apps/backend/src/services/bridge.ts) | Bridge service — burn on Stellar, CRE attestation verification, mint on destination |

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

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Mobile PWA (Next.js 14)                    │
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
│• nBRL  │      ┌─────┴────────────────────────────────────┐
│• Score │      │           Chainlink CRE DON               │
│• Line  │      │ WF1: Proof of Reserve (Horizon → Sepolia) │
└────────┘      │ WF2: AI Credit Scoring (LLM → Sepolia)   │
                │ WF3: Risk Monitor (metrics → Sepolia)     │
                │ WF4: Privacy Credit Check (TEE HTTP)      │
                │ WF5: Cross-Chain Bridge (burn/mint/attest)│
                └──┬─────────────────────────────┬──────────┘
                   │ onlyForwarder writes         │ EVM reads
          ┌────────┴───────────────────┐   ┌─────┴──────────┐
          │  Ethereum Sepolia          │   │  Solana Devnet /│
          │  • ReserveAttestation.sol  │   │  Avalanche Fuji │
          │  • CreditScoreAttestation  │   │  (bridge dest)  │
          │  • RiskReport.sol          │   └────────────────┘
          │  • PrivacyCreditCheck.sol  │
          └────────────────────────────┘
```

---

## Chainlink CRE Workflow Design

Each workflow runs on a cron schedule (`*/30 * * * * *` in staging, `*/5 * * * *` in production). All 5 workflows share a single `Runner` instance compiled to a single WASM bundle.

### WF1 — Proof of Reserve

Queries the Stellar Horizon API for the nUSD treasury balance, computes a reserve ratio, and writes the attestation to `ReserveAttestation.sol` on Sepolia.

- **Consensus**: `consensusMedianAggregation` across CRE nodes on reserve ratio
- **Sepolia write**: `updateReserves(balance, ratio, timestamp, alertThreshold)`
- **Alert**: If ratio < 100%, `AlertTriggered` event emits on-chain

### WF2 — AI Credit Scoring

Fetches on-chain transaction count and account age from Horizon, aggregates with `ConsensusAggregationByFields` (median for each numeric field), then passes to an LLM (Gemini API via `runtime.getSecret("GEMINI_API_KEY")`) for credit scoring.

- **Privacy**: API key injected via `runtime.getSecret()` — never hardcoded
- **Consensus**: `median` aggregation on `txCount` and `accountAgeDays`
- **Sepolia write**: `updateScore(address, score, txCount, accountAgeDays, timestamp, dataHash)`

### WF3 — Risk Monitor

Monitors reserve ratio, system utilization, and price volatility. Emits `AlertRaised` (severity 1=warning, 2=critical) or `AlertCleared` events on Sepolia.

- **Consensus**: `consensusMedianAggregation` on composite risk score
- **Sepolia write**: `updateRisk(reserveRatio, utilization, priceVol, isAlert, severity)`

### WF4 — Privacy Credit Check

Evaluates credit eligibility using `runtime.getSecret("CREDIT_API_KEY")` for the external credit bureau API. Stores only `keccak256(userId)` on-chain — zero PII.

- **Privacy architecture**: Raw credit data processed inside CRE nodes. Only a boolean result and a user hash reach the blockchain.
- **Upgrade path**: Replace `HTTPClient` with `ConfidentialHTTPClient` (CRE SDK >= 1.1.x) for TEE-secured HTTP calls
- **Consensus**: `identical` aggregation — all nodes must agree on eligibility
- **Sepolia write**: `recordEligibility(userHash, eligible, expiresAt)`

### WF5 — Cross-Chain Bridge

Verifies burn transactions on Stellar Horizon, generates a consensus attestation hash, and authorizes mint on the destination chain.

- **Consensus**: `identical` aggregation on burn tx hash — all nodes must agree
- **No Sepolia write** (attestation is off-chain signed message used by bridge relayer)

---

## Cross-Chain Bridge

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
2. Backend generates a signed MoonPay widget URL (secret key never exposed to frontend)
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
| Soroban Contracts | Rust (soroban-sdk 22.0.10) — 4 contracts deployed on Stellar Testnet |
| EVM Contracts | Solidity 0.8.24 (Foundry) — 4 attestation contracts on Ethereum Sepolia |
| CRE Workflows | @chainlink/cre-sdk (TypeScript → WASM) — 5 workflows, 4 tracks |
| On/Off-Ramp | MoonPay (PIX, SWIFT, Card, SEPA → USDC on Stellar) |
| Cross-Chain | Chainlink CRE bridge (Stellar ↔ Solana / Ethereum / Avalanche) |
| Networks | Stellar Testnet, Ethereum Sepolia, Solana Devnet, Avalanche Fuji |

---

## Monorepo Structure

```
NexusFi/
├── apps/
│   ├── frontend/              # Next.js 14 PWA (mobile-first)
│   │   └── src/
│   │       ├── app/           # Pages (dashboard, wallet, credit, deposit, bridge)
│   │       ├── components/    # Shared UI (BalanceCard, CreditCard, etc.)
│   │       └── lib/           # API client, formatters, hooks
│   └── backend/               # Express API server
│       └── src/
│           ├── routes/        # wallet, credit, deposit, bridge, cre, auth
│           ├── services/      # stellar, soroban, tokens, bridge, cre-bridge, moonpay
│           └── middleware/    # auth (Stellar signature verification)
├── contracts/
│   ├── nexusfi_token/         # nUSD + nBRL stablecoin (SEP-41, Soroban/Rust)
│   ├── credit_score/          # AI credit score storage (Soroban/Rust)
│   ├── credit_line/           # Credit card logic (Soroban/Rust)
│   └── evm/                   # Sepolia attestation contracts (Solidity/Foundry)
│       ├── src/               # ReserveAttestation, CreditScoreAttestation, RiskReport, PrivacyCreditCheck
│       ├── script/            # Deploy.s.sol — deploys all 4 contracts
│       └── test/              # Foundry tests
├── workflows/
│   └── cre/                   # Chainlink CRE workflows
│       ├── main.ts            # All 5 workflows (compiled to WASM by CRE CLI)
│       ├── workflow.yaml      # CRE workflow declaration
│       ├── project.yaml       # CRE project config (Sepolia RPC)
│       ├── config.staging.json
│       └── config.production.json
├── AUDIT.md                   # Full security + correctness audit report
├── docs/                      # Technical documentation
└── scripts/                   # Pre-commit secret scanning
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io) >= 8 — monorepo package manager
- [Bun](https://bun.sh) >= 1.0 — required for CRE workflow dev
- [Rust](https://rustup.rs) + `wasm32-unknown-unknown` target — for Soroban contracts
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) — for contract deployment
- [CRE CLI](https://docs.chain.link/cre/getting-started/overview) — for workflow simulation
- [Foundry](https://book.getfoundry.sh/getting-started/installation) — for Sepolia contracts

### 1. Install Dependencies

```bash
git clone https://github.com/your-org/nexusfi.git
cd nexusfi
pnpm install
```

### 2. Configure Environment

```bash
# Root env (Stellar, MoonPay, contract IDs)
cp .env.example .env
# Edit .env with your keys — see .env.example for all variables
```

Key variables to fill in:

| Variable | How to get |
|----------|-----------|
| `SOROBAN_SECRET_KEY` | `stellar keys generate deployer --network testnet` |
| `MOONPAY_PK` / `MOONPAY_SECRET_KEY` | [MoonPay Dashboard](https://dashboard.moonpay.com) |
| `NUSD_CONTRACT_ID` | After deploying Soroban contract (see below) |
| `CHAINLINK_OPERATOR_KEY` | Chainlink CRE project credentials |

### 3. Run Development Servers

```bash
pnpm dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

### Install PWA

Open `http://localhost:3000` on your phone's browser and tap "Add to Home Screen".

---

## Soroban Contracts (Stellar)

### Build

```bash
cd contracts

# Install Rust wasm target (once)
rustup target add wasm32-unknown-unknown

# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test
```

### Deploy

```bash
# Generate a deployer keypair (skip if already done)
stellar keys generate deployer --network testnet

# Deploy nUSD token
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source deployer --network testnet
# → records the contract ID as NUSD_CONTRACT_ID

# Initialize nUSD
stellar contract invoke \
  --id $NUSD_CONTRACT_ID --source deployer --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer) \
  --name "NexusFi USD" --symbol "nUSD" --decimals 7

# Deploy nBRL (same WASM, second instance)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source deployer --network testnet
# → records as NBRL_CONTRACT_ID

stellar contract invoke \
  --id $NBRL_CONTRACT_ID --source deployer --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer) \
  --name "NexusFi BRL" --symbol "nBRL" --decimals 7

# Deploy credit score + credit line contracts
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/credit_score.wasm \
  --source deployer --network testnet

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/credit_line.wasm \
  --source deployer --network testnet
```

---

## Sepolia Attestation Contracts (Foundry)

Four Solidity contracts receive attestations from the Chainlink CRE DON via the CRE Forwarder:

```
CRE Forwarder: 0x15fc6ae953e024d975e77382eeec56a9101f9f88
```

### Build & Test

```bash
cd contracts/evm

# Install Foundry dependencies
forge install foundry-rs/forge-std

# Build
forge build

# Run tests
forge test -v
```

### Deploy to Sepolia

```bash
cp contracts/evm/.env.example contracts/evm/.env
# Fill in SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY

forge script contracts/evm/script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

---

## CRE Workflow Simulation

The CRE CLI compiles `main.ts` to WASM and runs it against each workflow, producing deterministic consensus output without deploying to the live DON.

```bash
cd workflows/cre

# Install dependencies
bun install

# Simulate all 5 workflows (uses config.staging.json)
cre workflow simulate --workflow-file workflow.yaml --target staging
```

**Expected output** (per workflow):

```
✓ WF1 ProofOfReserve     consensus: { reserveRatio: 104, balance: 1000000 }
✓ WF2 CreditScoring      consensus: { txCount: 42, accountAgeDays: 180 }
✓ WF3 RiskMonitor        consensus: { riskScore: 12, isAlert: false }
✓ WF4 PrivacyCreditCheck consensus: { eligible: true, userHash: "0xabc..." }
✓ WF5 CrossChainBridge   consensus: { burnTxHash: "0xdef...", amount: 100 }
```

### Workflow Config Reference

| Key | Staging | Production | Description |
|-----|---------|-----------|-------------|
| `schedule` | `*/30 * * * * *` | `*/5 * * * *` | Cron — how often workflows run |
| `reserveAddress` | Stellar testnet address | Mainnet address | nUSD treasury address for WF1 |
| `bridgeWatchAddress` | Stellar testnet address | Mainnet address | Bridge escrow address for WF5 |

### Secrets (workflows/cre/secrets.yaml)

```bash
cp workflows/cre/secrets.yaml.example workflows/cre/secrets.yaml
# Fill in:
#   CREDIT_API_KEY: your credit bureau API key (WF4)
#   GEMINI_API_KEY: your Gemini/OpenAI API key (WF2)
```

Secrets are injected at runtime via `runtime.getSecret("KEY").result()` — never hardcoded in `main.ts`.

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

- **Secrets**: All credentials stored in `.env` / `secrets.yaml` files (gitignored). Pre-commit hook scans for leaked secrets using gitleaks patterns.
- **Frontend**: Never receives private keys. Only `NEXT_PUBLIC_*` variables exposed.
- **Backend**: Validates environment on startup via `validate-env.ts`. Refuses to start in production without required secrets.
- **CRE**: Workflow secrets injected via `runtime.getSecret()` — never hardcoded in `main.ts`. Confidential HTTP for sensitive API calls (WF4).
- **Soroban contracts**: `require_auth()` on all state-changing operations. Admin-only minting and score writing.
- **Sepolia contracts**: `onlyForwarder` modifier — only the CRE DON (`0x15fc...`) can write attestations.
- **MoonPay**: `MOONPAY_SECRET_KEY` stays server-side only (URL signing). Webhook callbacks verified with HMAC-SHA256 + `timingSafeEqual`.
- **Bridge**: CRE attestation hash required before any cross-chain mint. Burns verified on-chain before authorizing mints.
- **Privacy (WF4)**: Only `keccak256(userId)` stored on-chain — raw credit data, API credentials, and user PII never appear on the blockchain.

---

## License

MIT
