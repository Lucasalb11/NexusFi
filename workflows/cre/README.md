# NexusFi — CRE Workflows

Chainlink Runtime Environment workflows for NexusFi, targeting 4 hackathon tracks.

## Workflows

All workflows are in [`main.ts`](main.ts):

### WF1: Proof of Reserve (DeFi & Tokenization)
- **Trigger**: Cron (every 30s)
- **Flow**: HTTP GET Stellar Horizon (issuer balance) → HTTP GET price feed (CoinGecko) → Compute reserve ratio → Log attestation
- **Integration**: Stellar Horizon API + CoinGecko price API

### WF2: AI Credit Scoring (CRE & AI)
- **Trigger**: Cron
- **Flow**: HTTP GET Stellar Horizon (user tx history) → Process with AI/LLM scoring model → Compute credit score → Log attestation
- **Integration**: Stellar Horizon API + AI scoring engine

### WF3: Risk Monitor (Risk & Compliance)
- **Trigger**: Cron (every 30s)
- **Flow**: HTTP GET Stellar Horizon (protocol metrics) → HTTP GET price feeds → Compute risk → Trigger alert if threshold breached
- **Integration**: Stellar Horizon API + CoinGecko API

### WF4: Privacy Credit Check (Privacy)
- **Trigger**: Cron
- **Flow**: Confidential HTTP to credit API → Process eligibility in TEE → Return encrypted result
- **Integration**: Stellar Horizon API (Confidential HTTP in production)

## Running

```bash
# Install dependencies
bun install

# Simulate workflows
cre workflow simulate --workflow-file workflow.yaml --target staging
```

## Configuration

- `workflow.yaml` — Workflow targets (staging/production)
- `project.yaml` — RPC endpoints (Ethereum Sepolia)
- `config.staging.json` — Schedule: `*/30 * * * * *`
- `secrets.yaml` — Credentials (gitignored, create from `secrets.yaml.example`)

## SDK

Uses `@chainlink/cre-sdk` v1.0.9 with:
- `CronCapability` — Schedule-based triggers
- `HTTPClient` — Offchain API requests with consensus
- `consensusMedianAggregation` — Numeric consensus
- `ConsensusAggregationByFields` — Complex object consensus
