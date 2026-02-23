# NexusFi — Soroban Smart Contracts

Three Soroban contracts powering the NexusFi decentralized fintech.

## Contracts

### nexusfi_token (nUSD Stablecoin)
SEP-41 compatible token on Stellar Soroban.

**Functions:**
- `initialize(admin, name, symbol, decimals)` — One-time setup
- `mint(to, amount)` — Admin-only, mints nUSD when user deposits fiat
- `burn(from, amount)` — Burns nUSD when user withdraws
- `transfer(from, to, amount)` — P2P transfer
- `approve(from, spender, amount, expiration)` — Set allowance
- `transfer_from(spender, from, to, amount)` — Delegated transfer
- `balance(id)`, `total_supply()`, `name()`, `symbol()`, `decimals()`

### credit_score
Stores AI-computed credit scores on-chain, written by CRE workflow.

**Functions:**
- `initialize(admin)` — One-time setup
- `set_score(user, score, timestamp, metadata_hash)` — Admin-only write
- `get_score(user)` — Read latest score
- `get_history(user)` — Read score history (up to 20 records)

Score range: 0–1000.

### credit_line
Decentralized credit card logic with score-based tiers.

**Functions:**
- `initialize(admin)` — One-time setup
- `open_credit_line(user, score, timestamp)` — Admin-only, sets limit based on score tier
- `use_credit(user, amount)` — Spend on credit card
- `repay(user, amount)` — Repay balance
- `get_credit_info(user)`, `get_available(user)`

**Score Tiers:**
| Score | Limit | Interest Rate |
|-------|-------|---------------|
| >= 800 | $10,000 | 3.0% APR |
| >= 600 | $5,000 | 8.0% APR |
| >= 400 | $2,000 | 15.0% APR |
| < 400 | $500 | 25.0% APR |

## Building

```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```

## Testing

```bash
cd contracts
cargo test
```

## Deploying

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```
