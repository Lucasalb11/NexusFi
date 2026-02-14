# Deploy - NexusFi

## Pré-requisitos

- Node.js >= 18, pnpm >= 8
- Conta e ambiente na Stellar (testnet/mainnet)
- (Opcional) Chainlink para oráculos

## Build

```bash
pnpm install
pnpm build
```

## Variáveis de produção

- Definir todas as variáveis do `.env.example` no ambiente de produção.
- Nunca commitar `.env` ou chaves.
- Usar secrets do provedor (Vercel, Railway, etc.) para `API_SECRET_KEY`, `SOROBAN_SECRET_KEY`, chaves Chainlink.

## Frontend (ex.: Vercel)

- Build command: `pnpm build:frontend` (ou `pnpm --filter frontend build`).
- Root directory: `apps/frontend` ou configurar monorepo no painel.
- Variáveis: `NEXT_PUBLIC_API_URL` apontando para o backend em produção.

## Backend (ex.: Node em VPS/container)

- Rodar `pnpm --filter backend start` após `pnpm build`.
- Garantir `NODE_ENV=production` e `PORT` definidos.

## Contratos Soroban

- Build: `cargo build --release --target wasm32-unknown-unknown` em `contracts/nexusfi_token`.
- Deploy via Soroban CLI ou ferramenta de deploy do projeto, usando RPC e network passphrase da rede alvo.
