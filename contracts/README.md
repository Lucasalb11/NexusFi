# NexusFi - Soroban Contracts (Rust)

Smart contracts for the Stellar network (Soroban).

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli)

## Commands

```bash
# Tests
cargo test

# Build (release, optimized for Soroban)
cargo build --release --target wasm32-unknown-unknown

# Deploy (example with Soroban CLI)
# soroban contract deploy --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm --source <SECRET_KEY> --rpc-url <RPC_URL> --network-passphrase "<PASSPHRASE>"
```

## Structure

- `nexusfi_token/` – placeholder token contract; replace with desired logic or use the default Stellar token.

## Security

- Never commit private keys.
- Use environment variables for `SOROBAN_SECRET_KEY` and RPC URLs.
- Follow [Soroban best practices](https://soroban.stellar.org/docs).
