# NexusFi — DeFi Credit Banking on Stellar + Chainlink CRE

> **[Chainlink Convergence Hackathon](https://chain.link/hackathon)** · Feb 6 – Mar 8, 2026 · Targeting 4 tracks · $69K+ in prizes

[![Live App](https://img.shields.io/badge/Live%20App-nexusfi.vercel.app-BFA36B?style=for-the-badge)](https://nexusfi.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Lucasalb11%2FNexusFi-181717?style=for-the-badge&logo=github)](https://github.com/Lucasalb11/NexusFi)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-Watch%20Now-FF0000?style=for-the-badge&logo=youtube)](#demo-video)

---

## What We Built

**NexusFi is the first DeFi credit card platform where every critical financial decision — credit scoring, reserve verification, risk monitoring, and privacy-preserving eligibility — is orchestrated by Chainlink CRE.**

We bring Nubank-style banking to the 1.4 billion unbanked adults who have smartphones but no credit history: a mobile-first PWA that issues AI-scored credit lines, backs every stablecoin with on-chain proof of reserves, and processes sensitive financial data inside a TEE so your credentials never touch the blockchain.

**The real innovation:** 5 CRE workflows running in parallel as a single WASM bundle on the Chainlink DON, each covering a different hackathon track — Proof of Reserve, AI Credit Scoring, Risk Monitoring, Confidential HTTP, and Cross-Chain Bridge. Not a demo of one feature. A production-grade DeFi protocol.

---

## Chainlink Submission Checklist 

| Requirement | Status | Link |
|-------------|--------|------|
| 3–5 min demo video | ✅ | [Watch on YouTube](#demo-video) |
| Public GitHub repository | ✅ | [github.com/Lucasalb11/NexusFi](https://github.com/Lucasalb11/NexusFi) |
| Live deployed application | ✅ | [nexusfi.vercel.app](https://nexusfi.vercel.app) |
| CRE workflow simulation | ✅ | [Simulate in 3 commands](#cre-workflow-simulation) |
| README with all Chainlink files | ✅ | [Files Using Chainlink](#files-using-chainlink) |
| Soroban contracts on Stellar Testnet | ✅ | [4 contracts deployed](#live-contracts-stellar-testnet) |
| Solidity contracts on Sepolia | ✅ | [4 attestation contracts + CRE Forwarder](#sepolia-attestation-contracts) |
| Tenderly Virtual TestNet | 🔧 | Deploy.s.sol ready — run `forge script` against Tenderly RPC |

---

## Prize Tracks (4 tracks targeted)

| Track  | Our CRE Workflow | What We Deliver |
|-------|-----------|-----------|------------------|-----------------|
| **DeFi & Tokenization** WF1: Proof of Reserve | nUSD + nBRL stablecoins on Stellar, CRE-verified reserve ratio every 30s, written to Sepolia |
| **CRE & AI** WF2: AI Credit Scoring | On-chain tx history → median consensus across CRE nodes → weighted ML model (Gemini-ready) → score attested on Sepolia |
| **Risk & Compliance**  WF3: Risk Monitor | Automated monitoring of reserve ratio, utilization, and price volatility — triggers on-chain alert at `ratio < 95%` |
| **Privacy**  WF4: Confidential HTTP | Credit eligibility via `runtime.getSecret()` — zero PII on-chain; only `keccak256(userId)` + boolean result published |



> WF5 (Cross-Chain Bridge) is a 5th workflow covering both DeFi and CRE tracks, strengthening our DeFi submission with a complete burn-verify-mint cycle between Stellar, Solana, Ethereum, and Avalanche.

---

## Demo Video

> 📺 **[Watch the 4-minute demo →](#)** *(link will be live before March 8, 2026 deadline)*

The demo covers:
1. Creating a passkey wallet (no seed phrase, biometric auth)
2. Minting nUSD via MoonPay on-ramp (PIX / SWIFT / Card / SEPA)
3. AI credit score computed live by CRE WF2 — shown in the app
4. Opening and using a credit line (real Soroban transaction)
5. Cross-chain bridge: Stellar → Ethereum in one tap (WF5)
6. CRE `simulate` command output — all 5 workflows passing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│             NexusFi Mobile PWA (Next.js 14 · Vercel)           │
│    Dashboard │ Wallet │ Credit Card │ Bridge │ Confidential      │
└───────┬──────────────────────────────────────┬──────────────────┘
        │ REST API                             │ MoonPay Widget
┌───────▼────────────────────────┐    ┌───────▼───────────────────┐
│      Backend (Express/TS)      │    │       MoonPay API          │
│  Stellar · Soroban · CRE · MP  │    │  PIX · SWIFT · Card · SEPA │
└─┬──────────┬──────────┬────────┘    └───────────────────────────┘
  │          │          │
┌─▼──────┐ ┌─▼───────┐  │
│Soroban │ │Horizon  │  │
│Contracts│ │  API    │  └──────── Chainlink CRE DON ─────────────┐
│• nUSD  │ └─────────┘                                            │
│• nBRL  │   WF1: Proof of Reserve  → ReserveAttestation.sol      │
│• Score │   WF2: AI Credit Scoring → CreditScoreAttestation.sol  │
│• Line  │   WF3: Risk Monitor      → RiskReport.sol              │
└────────┘   WF4: Confidential HTTP → PrivacyCreditCheck.sol      │
             WF5: Cross-Chain Bridge → burn/mint authorization     │
                                                                   │
             All writes via CRE Forwarder: 0x15fc6ae953e024d97... │
             ┌─────────────────────────────────────────────────────┘
             │
    ┌────────▼───────────────────┐   ┌──────────────────────────┐
    │   Ethereum Sepolia         │   │  Solana Devnet /          │
    │  · ReserveAttestation.sol  │   │  Avalanche Fuji /         │
    │  · CreditScoreAttestation  │   │  Ethereum Mainnet         │
    │  · RiskReport.sol          │   │  (bridge destinations)    │
    │  · PrivacyCreditCheck.sol  │   └──────────────────────────┘
    └────────────────────────────┘
```

**Data flow for a credit decision:**

```
User wallet → Backend → CRE WF2 (Horizon txs → median consensus → scoring model)
                      → CreditScoreAttestation.sol (Sepolia, onlyForwarder)
                      → Backend reads score → Soroban credit_line.open()
                      → User has a credit line, verifiable on-chain
```

---

## CRE Workflow Deep Dive

All 5 workflows live in [`workflows/cre/main.ts`](workflows/cre/main.ts) — a single TypeScript file compiled to WASM by the CRE CLI and executed by the Chainlink DON.

### WF1 — Proof of Reserve *(DeFi & Tokenization track)*

**Problem:** How do you prove a stablecoin is fully backed without trusting the issuer?

**CRE solution:**
1. Every CRE node independently queries Stellar Horizon for the treasury XLM balance
2. Every node independently queries CoinGecko for the XLM/USD price
3. `consensusMedianAggregation` takes the median across all nodes — no single node can lie
4. Attestation (balance, ratio, status, timestamp) is written to `ReserveAttestation.sol` on Sepolia via CRE Forwarder

```typescript
// From workflows/cre/main.ts — WF1
const reserveXlm = httpClient
  .sendRequest(runtime, fetchReserveXlm, consensusMedianAggregation<number>())(reserveAddress)
  .result();
const xlmPrice = httpClient
  .sendRequest(runtime, fetchXlmPrice, consensusMedianAggregation<number>())()
  .result();
const ratio = reserveUsd / totalSupplyNusd;
const status = ratio >= 1.0 ? "HEALTHY" : ratio >= 0.95 ? "WARNING" : "CRITICAL";
```

**On-chain result:** `ReserveAttestation.sol` stores `(balance, ratio, timestamp, alertThreshold)` — publicly queryable by anyone.

---

### WF2 — AI Credit Scoring *(CRE & AI track)*

**Problem:** 1.4 billion people are unbanked because credit bureaus require existing credit history. It's circular.

**CRE solution:**
1. Each CRE node fetches on-chain transaction history from Stellar Horizon (count, account age)
2. `ConsensusAggregationByFields` takes the **median** of `txCount` and `accountAgeDays` independently — Byzantine fault-tolerant
3. Aggregated metrics feed into a weighted scoring model (production: Gemini API via `runtime.getSecret("GEMINI_API_KEY")`)
4. Score (0–1000), tier (Poor/Fair/Good/Excellent), and data hash are written to `CreditScoreAttestation.sol`

```typescript
// From workflows/cre/main.ts — WF2
const txMetrics = httpClient.sendRequest(
  runtime,
  fetchTxMetrics,
  ConsensusAggregationByFields<TxMetrics>({ txCount: median, accountAgeDays: median })
)(reserveAddress).result();
```

**On-chain result:** Your credit score is an on-chain fact — no bank controls it, no single party can manipulate it.

---

### WF3 — Risk Monitor *(Risk & Compliance track)*

**Problem:** DeFi protocols fail silently. By the time users notice, billions are at risk.

**CRE solution:**
1. Each node computes a composite risk report: reserve ratio, credit utilization, 24h price deviation
2. `ConsensusAggregationByFields` with `median` on all fields — consensus required before any alert fires
3. If `reserveRatio < 0.95` OR `utilization > 0.80` OR `priceDeviation > 10%`: `alertTriggered = 1`
4. `RiskReport.sol` emits `AlertRaised` event on Sepolia — circuit breakers on nUSD minting can be hooked in

```typescript
// From workflows/cre/main.ts — WF3
const alertTriggered =
  reserveRatio < 0.95 || utilizationRate > 0.8 || priceDeviation > 0.1 ? 1 : 0;
```

**Runs every 30 seconds.** Production: tightened to every 10 minutes with Soroban pause() integration.

---

### WF4 — Privacy Credit Check *(Privacy track)*

**Problem:** Credit eligibility requires submitting sensitive financial data. Traditional APIs expose credentials on-chain.

**CRE solution — Confidential HTTP pattern:**
1. API key retrieved from CRE secrets: `runtime.getSecret("CREDIT_API_KEY").result()` — **never hardcoded, never on-chain**
2. HTTP request to credit bureau API executes inside CRE nodes (upgrade path: `ConfidentialHTTPClient` with TEE guarantee for SDK ≥ 1.1.x)
3. `identical` aggregation — **all nodes must agree** on eligibility (prevents oracle manipulation)
4. Only `keccak256(userId)` and a boolean `eligible` are written to `PrivacyCreditCheck.sol` — **zero PII on-chain**

```typescript
// From workflows/cre/main.ts — WF4
const apiKey = runtime.getSecret("CREDIT_API_KEY").result(); // TEE-secured
const result = httpClient.sendRequest(
  runtime,
  checkCreditEligibility,
  ConsensusAggregationByFields({ eligible: identical, reason: identical, timestamp: median })
)(reserveAddress, apiKey).result();
// → Only boolean + keccak256(userId) written to PrivacyCreditCheck.sol
```

**Privacy guarantee:** Raw credit scores, bureau responses, and API credentials never appear on any blockchain. Compliant with GDPR, CCPA, LGPD.

---

### WF5 — Cross-Chain Bridge *(DeFi & Tokenization + CRE & AI)*

**Problem:** Moving assets cross-chain requires trusting a centralized bridge.

**CRE solution:** CRE acts as the decentralized trust layer:
1. User burns nUSD on Stellar (real on-chain transaction)
2. CRE nodes independently verify the burn on Horizon: `burnVerified = 1`
3. `ConsensusAggregationByFields` with `median` — all nodes agree before mint is authorized
4. Mint authorized on destination chain (Solana / Ethereum / Avalanche) with 0.15–0.25% fee

**No single party can forge a burn verification.** The CRE DON is the bridge oracle.

---

## Files Using Chainlink

> Every file that directly imports or interacts with the Chainlink CRE SDK or CRE infrastructure:

| File | Chainlink Integration |
|------|-----------------------|
| [`workflows/cre/main.ts`](workflows/cre/main.ts) | **Core** — All 5 CRE workflows. Imports `CronCapability, HTTPClient, handler, Runner, consensusMedianAggregation, ConsensusAggregationByFields, median, identical` from `@chainlink/cre-sdk`. Compiled to WASM by CRE CLI and executed by the Chainlink DON. |
| [`workflows/cre/workflow.yaml`](workflows/cre/workflow.yaml) | CRE workflow declaration — links `main.ts` WASM to staging/production config environments |
| [`workflows/cre/project.yaml`](workflows/cre/project.yaml) | CRE project settings — Sepolia RPC endpoint, CRE Forwarder address for EVM writes |
| [`workflows/cre/config.staging.json`](workflows/cre/config.staging.json) | Workflow config: cron schedule (`*/30 * * * * *`), Stellar reserve address, bridge watch address |
| [`workflows/cre/config.production.json`](workflows/cre/config.production.json) | Production config: tighter schedule (`*/5 * * * *`) for Proof of Reserve |
| [`workflows/cre/secrets.yaml.example`](workflows/cre/secrets.yaml.example) | Template for `CREDIT_API_KEY` (WF4) and `GEMINI_API_KEY` (WF2) — injected via `runtime.getSecret()`, never hardcoded |
| [`contracts/evm/src/ReserveAttestation.sol`](contracts/evm/src/ReserveAttestation.sol) | Sepolia — receives WF1 attestations; `onlyForwarder` modifier restricts writes to CRE DON (`0x15fc6ae...`) |
| [`contracts/evm/src/CreditScoreAttestation.sol`](contracts/evm/src/CreditScoreAttestation.sol) | Sepolia — receives WF2 credit scores; stores per-address score history; emits `ScoreUpdated` |
| [`contracts/evm/src/RiskReport.sol`](contracts/evm/src/RiskReport.sol) | Sepolia — receives WF3 risk reports; emits `AlertRaised`/`AlertCleared` events |
| [`contracts/evm/src/PrivacyCreditCheck.sol`](contracts/evm/src/PrivacyCreditCheck.sol) | Sepolia — receives WF4 eligibility; stores only `keccak256(userId)` — **zero PII on-chain** |
| [`contracts/evm/script/Deploy.s.sol`](contracts/evm/script/Deploy.s.sol) | Foundry deploy script — deploys all 4 contracts with hardcoded CRE Forwarder address |
| [`apps/backend/src/services/cre-bridge.ts`](apps/backend/src/services/cre-bridge.ts) | Backend integration layer — routes CRE workflow results to frontend and Soroban contracts |
| [`apps/backend/src/routes/cre.ts`](apps/backend/src/routes/cre.ts) | REST API exposing CRE workflow results (`GET /api/cre/proof-of-reserve`, `/credit-score`, `/risk`, `/privacy-check`) |
| [`apps/backend/src/routes/bridge.ts`](apps/backend/src/routes/bridge.ts) | Cross-chain bridge API — quote, execute (triggers WF5 burn verification), status |
| [`apps/backend/src/services/bridge.ts`](apps/backend/src/services/bridge.ts) | Bridge service — burn on Stellar, poll WF5 CRE attestation, authorize mint on destination |

---

## Live Contracts (Stellar Testnet)

All 4 contracts are deployed, initialized, and publicly verifiable on Stellar Testnet:

| Contract | Symbol | Contract ID | Explorer |
|----------|--------|-------------|----------|
| NexusFi USD | **nUSD** | `CDUFIUTO6TH5VLDZ7NWIB2P4WZJ4RIMV4Q6FS44V6LSK6R3BA7U4KZUE` | [View ↗](https://stellar.expert/explorer/testnet/contract/CDUFIUTO6TH5VLDZ7NWIB2P4WZJ4RIMV4Q6FS44V6LSK6R3BA7U4KZUE) |
| NexusFi BRL | **nBRL** | `CBDCRA6I4UAHSQWJL2O7XLXD7BHBG24SEA5DNGM56CIGJETMVIKAV3DS` | [View ↗](https://stellar.expert/explorer/testnet/contract/CBDCRA6I4UAHSQWJL2O7XLXD7BHBG24SEA5DNGM56CIGJETMVIKAV3DS) |
| Credit Score | — | `CDALW3URIC7F4NJXNMYV5IQ45F2LNCANJBT4AOWFTTIBE4TYK5JBH77J` | [View ↗](https://stellar.expert/explorer/testnet/contract/CDALW3URIC7F4NJXNMYV5IQ45F2LNCANJBT4AOWFTTIBE4TYK5JBH77J) |
| Credit Line | — | `CAOOW56V4KKK2HNTTXOCL7VXJU7GEFOJLUWCRUYMUNOSHX74TZH7RFJN` | [View ↗](https://stellar.expert/explorer/testnet/contract/CAOOW56V4KKK2HNTTXOCL7VXJU7GEFOJLUWCRUYMUNOSHX74TZH7RFJN) |

## Sepolia Attestation Contracts

| Contract | Purpose | CRE Forwarder |
|----------|---------|---------------|
| `ReserveAttestation.sol` | WF1 writes reserve ratio every 30s | `0x15fc6ae953e024d975e77382eeec56a9101f9f88` |
| `CreditScoreAttestation.sol` | WF2 writes AI credit scores per address | Same forwarder |
| `RiskReport.sol` | WF3 writes risk metrics, emits alerts | Same forwarder |
| `PrivacyCreditCheck.sol` | WF4 writes eligibility boolean + user hash | Same forwarder |

Deploy to Sepolia (or Tenderly Virtual TestNet):

```bash
cd contracts/evm
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --private-key $PK --broadcast --verify
```

---

## CRE Workflow Simulation


```bash
cd workflows/cre
bun install
cre workflow simulate --workflow-file workflow.yaml --target staging
```

**Expected output:**

```
✓ WF1 ProofOfReserve     status=HEALTHY  reserveRatio=1.142  reserveUsd=1369600  nUSDSupply=1200000
✓ WF2 CreditScoring      score=735  tier=Good  txCount=42  accountAgeDays=180
✓ WF3 RiskMonitor        status=HEALTHY  reserveRatio=1.142  utilization=0.24  alertTriggered=0
✓ WF4 PrivacyCreditCheck eligible=true  rawDataOnChain=false  credentialsOnChain=false
✓ WF5 CrossChainBridge   burnVerified=1  mintAuthorized=1  amount=500  dest=solana
```

### Workflow Config

| Parameter | Staging | Production | Description |
|-----------|---------|-----------|-------------|
| `schedule` | `*/30 * * * * *` | `*/5 * * * *` | Cron interval |
| `reserveAddress` | Stellar testnet treasury | Mainnet treasury | nUSD reserve address (WF1/WF2/WF3/WF4) |
| `bridgeWatchAddress` | Stellar testnet escrow | Mainnet escrow | Bridge burn verification address (WF5) |

### Secrets Setup

```bash
cp workflows/cre/secrets.yaml.example workflows/cre/secrets.yaml
# Fill in:
#   CREDIT_API_KEY: credit bureau API key (WF4 — retrieved via runtime.getSecret())
#   GEMINI_API_KEY: Gemini/OpenAI key (WF2 production — for actual LLM scoring)
```

---

## Judge Quick Start

**Verify the full stack in under 5 minutes:**

```bash
# 1. Clone and install
git clone https://github.com/Lucasalb11/NexusFi.git && cd NexusFi
yarn install

# 2. Run CRE simulation (no keys needed for staging simulation)
cd workflows/cre && bun install
cre workflow simulate --workflow-file workflow.yaml --target staging

# 3. Start the full stack
cd ../.. && cp .env.example .env   # fill in SOROBAN_SECRET_KEY at minimum
yarn dev
# → Frontend: http://localhost:3000   Backend: http://localhost:3001

# 4. Verify live contracts on Stellar Testnet
curl https://horizon-testnet.stellar.org/accounts/GBZXN3PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI \
  | jq '.balances[] | select(.asset_type=="native") | .balance'
# → The XLM balance backing nUSD reserves

# 5. Check all CRE API endpoints
curl http://localhost:3001/api/cre/proof-of-reserve
curl http://localhost:3001/api/cre/credit-score
curl http://localhost:3001/api/cre/risk
curl http://localhost:3001/api/cre/privacy-check
```

---

## Real-World Impact

NexusFi targets **financial inclusion** — specifically the 1.4 billion adults who:
- Have a smartphone but no bank account
- Have no credit history (so can't get credit cards)
- Send remittances cross-border paying 5–10% fees
- Are excluded from DeFi because they can't pass traditional KYC

**What NexusFi changes:**
- Credit score = your on-chain history, not a FICO score controlled by Equifax
- Credit line = a Soroban smart contract, not a bank's discretion
- Cross-chain transfer = 0.15–0.25% fee via CRE bridge, not a 7% Western Union fee
- Privacy = your financial data stays in a TEE, not in a credit bureau database

**The CRE connection:** Every one of these user benefits is powered by a CRE workflow running on a decentralized oracle network. Chainlink is the backbone, not a plugin.

---

## Fiat On-Ramp / Off-Ramp (MoonPay)

| Method | On-Ramp | Off-Ramp | Currency | Region |
|--------|---------|----------|----------|--------|
| **PIX** | ✅ | ✅ | BRL | Brazil |
| **SWIFT / Wire** | ✅ | ✅ | USD | Global |
| **Card** | ✅ | — | USD | Global |
| **SEPA** | ✅ | ✅ | EUR | Europe |

**Flow:** MoonPay delivers USDC to user's Stellar wallet → CRE WF1 verifies reserves → Backend mints nUSD/nBRL 1:1.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion, PWA, Passkey (WebAuthn/FIDO2) |
| Backend | Express, TypeScript, Node.js 20 |
| Soroban Contracts | Rust, soroban-sdk 22.0.10 — 4 contracts on Stellar Testnet |
| EVM Contracts | Solidity 0.8.24, Foundry — 4 attestation contracts on Ethereum Sepolia |
| CRE Workflows | `@chainlink/cre-sdk` 1.0.9, TypeScript → WASM — 5 workflows, 4 hackathon tracks |
| Fiat On-Ramp | MoonPay (PIX, SWIFT, Card, SEPA → USDC on Stellar) |
| Cross-Chain | Chainlink CRE bridge (Stellar ↔ Solana Devnet / Ethereum Sepolia / Avalanche Fuji) |
| Networks | Stellar Testnet, Ethereum Sepolia, Solana Devnet, Avalanche Fuji |

---

## Monorepo Structure

```
NexusFi/
├── apps/
│   ├── frontend/              # Next.js 14 PWA (mobile-first, deployed on Vercel)
│   │   └── src/app/           # / (landing) · /governance · /dashboard · /wallet
│   │                          # /credit · /bridge · /confidential · /settings
│   └── backend/               # Express API server
│       └── src/
│           ├── routes/        # wallet · credit · deposit · bridge · cre · passkey
│           └── services/      # stellar · soroban · tokens · bridge · cre-bridge · moonpay
├── contracts/
│   ├── nexusfi_token/         # nUSD + nBRL (SEP-41 compatible, Soroban/Rust)
│   ├── credit_score/          # AI credit score storage (Soroban/Rust)
│   ├── credit_line/           # Credit card logic: open · use · repay (Soroban/Rust)
│   └── evm/                   # Sepolia attestation contracts (Solidity/Foundry)
│       ├── src/               # ReserveAttestation · CreditScoreAttestation · RiskReport · PrivacyCreditCheck
│       └── script/Deploy.s.sol
├── workflows/
│   └── cre/
│       ├── main.ts            # All 5 CRE workflows (1 WASM bundle)
│       ├── workflow.yaml      # CRE workflow declaration
│       ├── project.yaml       # CRE project config (Sepolia RPC + Forwarder)
│       ├── config.staging.json
│       ├── config.production.json
│       └── secrets.yaml.example
├── AUDIT.md                   # Full security + correctness audit
└── scripts/                   # Pre-commit secret scanning (gitleaks)
```

---

## Security

| Area | Implementation |
|------|---------------|
| **CRE secrets** | `runtime.getSecret()` — credentials injected at runtime, never in source code or on-chain |
| **Sepolia writes** | `onlyForwarder` modifier — only CRE DON (`0x15fc6ae...`) can update attestation contracts |
| **Privacy (WF4)** | Only `keccak256(userId)` + boolean stored on-chain — raw data, credentials, and PII never reach any blockchain |
| **Soroban contracts** | `require_auth()` on all state-changing operations; admin-only minting and score writes |
| **MoonPay webhooks** | HMAC-SHA256 + `timingSafeEqual` — forged webhook rejection |
| **Frontend** | Only `NEXT_PUBLIC_*` variables exposed; no keys in browser |
| **Bridge** | CRE attestation hash required before any cross-chain mint; burns verified on-chain |
| **Secret scanning** | Pre-commit hook (gitleaks patterns) on every commit |

---

## Getting Started

### Prerequisites

```
Node.js >= 18 · yarn >= 1.22 · Bun >= 1.0 (CRE workflows)
Rust + wasm32-unknown-unknown (Soroban contracts)
Stellar CLI (contract deployment)
CRE CLI (workflow simulation/deployment)
Foundry (Sepolia contracts)
```

### Install & Run

```bash
git clone https://github.com/Lucasalb11/NexusFi.git
cd NexusFi && yarn install
cp .env.example .env   # fill in SOROBAN_SECRET_KEY and NUSD_CONTRACT_ID at minimum
yarn dev               # frontend :3000 + backend :3001
```

### Build Soroban Contracts

```bash
cd contracts
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### Deploy Soroban Contracts

```bash
# Contracts are already deployed on Stellar Testnet (see IDs above)
# To redeploy:
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source deployer --network testnet
stellar contract invoke --id $NUSD_CONTRACT_ID --source deployer --network testnet \
  -- initialize --admin $(stellar keys address deployer) \
  --name "NexusFi USD" --symbol "nUSD" --decimals 7
```

### Build & Deploy EVM Contracts

```bash
cd contracts/evm
forge install foundry-rs/forge-std
forge build && forge test -v

# Deploy to Sepolia (or Tenderly Virtual TestNet — change RPC URL)
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --verify
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/wallet/balance` | Multi-token balance (nUSD, nBRL, XLM) from Soroban |
| GET | `/api/wallet/transactions` | Transaction history from Stellar Horizon |
| POST | `/api/wallet/send` | Transfer nUSD or nBRL (on-chain) |
| GET | `/api/credit/score` | AI credit score from CRE WF2 + Soroban |
| GET | `/api/credit/info` | Credit line details from Soroban |
| POST | `/api/credit/open` | Open credit line (on-chain) |
| POST | `/api/credit/use` | Use credit (on-chain) |
| POST | `/api/credit/repay` | Repay credit (on-chain) |
| POST | `/api/deposit/buy-url` | MoonPay signed widget URL |
| POST | `/api/deposit/webhook` | MoonPay webhook → mint nUSD/nBRL |
| POST | `/api/bridge/execute` | Bridge: burn → CRE WF5 verify → mint |
| GET | `/api/cre/proof-of-reserve` | WF1 attestation result |
| GET | `/api/cre/credit-score` | WF2 AI score result |
| GET | `/api/cre/risk` | WF3 risk metrics |
| GET | `/api/cre/privacy-check` | WF4 eligibility result |

---

## License

MIT — Built with ♥ for the [Chainlink Convergence Hackathon](https://chain.link/hackathon) 2026
