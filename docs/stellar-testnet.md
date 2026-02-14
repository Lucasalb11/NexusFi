# Stellar Testnet Setup

Step-by-step guide to configure Stellar **Testnet** for developing and deploying Soroban contracts in NexusFi.

## 1. Install Soroban CLI

Requires [Rust](https://rustup.rs/) (stable) first.

```bash
cargo install soroban-cli
```

Verify:

```bash
soroban --version
```

## 2. Testnet endpoints

| Setting | Value |
|--------|--------|
| **RPC URL** | `https://soroban-testnet.stellar.org` |
| **Network passphrase** | `Test SDF Network ; September 2015` |

Alternative RPC providers (if needed): [Stellar RPC providers](https://developers.stellar.org/docs/data/apis/rpc/providers).

## 3. Create and fund a testnet account

### Option A: Soroban CLI (recommended)

Create a new keypair and store it with a name (e.g. `nexusfi-deploy`):

```bash
soroban keys generate nexusfi-deploy
```

This prints a **secret key** (starts with `S...`). **Never commit it.** Use it as `SOROBAN_SECRET_KEY` in `.env`.

Fund the account on testnet using [Friendbot](https://laboratory.stellar.org/#account-creator?network=test): paste your **public key** (from `soroban keys address nexusfi-deploy` or the `G...` address shown when you generated the key). Friendbot will send testnet lumens to that address.

### Option B: Stellar Laboratory

1. Open [Account Creator (Testnet)](https://laboratory.stellar.org/#account-creator?network=test).
2. Generate a keypair and fund with Friendbot.
3. Copy the **secret key** for `.env` and (optional) import into Soroban CLI:  
   `soroban keys add nexusfi-deploy --secret-key <YOUR_SECRET_KEY>`.

## 4. Configure environment

In the project root, copy the example env and set Stellar variables:

```bash
cp .env.example .env
```

Edit `.env` and ensure:

```env
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
SOROBAN_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SOROBAN_SECRET_KEY=S...your_secret_key...
```

- Use these values only for **testnet**. For mainnet, switch RPC URL and passphrase and use a funded mainnet key.
- Keep `SOROBAN_SECRET_KEY` only in backend/env; never expose it in the frontend or in version control.

## 5. Verify connection

List identities (your key should appear):

```bash
soroban keys list
```

Check that the CLI can talk to testnet (optional):

```bash
soroban network ls
```

You should see `testnet` (or the configured network) and the RPC URL.

## 6. Deploy a contract (optional)

From the repo root:

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

Deploy (replace `nexusfi-deploy` with your key name if different):

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source nexusfi-deploy \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

Or use env vars so you don’t pass secrets on the command line:

```bash
export SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
export SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm \
  --source nexusfi-deploy
```

## Security reminders

- **Never** commit `.env` or any file containing `SOROBAN_SECRET_KEY`.
- Use testnet keys only on testnet; use a separate key (and env) for mainnet.
- Prefer environment variables over CLI flags for secrets in scripts and CI.

## References

- [Soroban getting started](https://soroban.stellar.org/docs/getting-started/setup)
- [Stellar Laboratory (testnet)](https://laboratory.stellar.org/#account-creator?network=test)
- [RPC providers](https://developers.stellar.org/docs/data/apis/rpc/providers)
