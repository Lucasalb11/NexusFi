# NexusFi - Contratos Soroban (Rust)

Contratos inteligentes para a rede Stellar (Soroban).

## Pré-requisitos

- [Rust](https://rustup.rs/) (stable)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli)

## Comandos

```bash
# Testes
cargo test

# Build (release, otimizado para Soroban)
cargo build --release --target wasm32-unknown-unknown

# Deploy (exemplo com Soroban CLI)
# soroban contract deploy --wasm target/wasm32-unknown-unknown/release/nexusfi_token.wasm --source <SECRET_KEY> --rpc-url <RPC_URL> --network-passphrase "<PASSPHRASE>"
```

## Estrutura

- `nexusfi_token/` – contrato de token placeholder; substitua pela lógica desejada ou use o token padrão Stellar.

## Segurança

- Nunca commitar chaves privadas.
- Use variáveis de ambiente para `SOROBAN_SECRET_KEY` e RPC URLs.
- Siga as [boas práticas Soroban](https://soroban.stellar.org/docs).
