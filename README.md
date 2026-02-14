# NexusFi

Monorepo for the **NexusFi** project (Next.js frontend, Node.js backend, Soroban/Rust contracts, and CRE workflows).

## Repository structure

```
NexusFi/
├── apps/
│   ├── frontend/     # Next.js 14 (App Router, TypeScript, Tailwind)
│   └── backend/      # Node.js + Express (REST API)
├── contracts/        # Soroban (Rust) - Stellar smart contracts
├── workflows/        # CRE workflows (Chainlink)
│   └── cre/          # NexusFi CRE workflow (cron, configs, project.yaml)
├── docs/             # Technical documentation
├── package.json      # Root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example      # Example env vars (copy to .env)
└── README.md
```

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 (`npm install -g pnpm`)
- **Rust** (for contracts): [rustup.rs](https://rustup.rs)
- **Soroban CLI** (optional, for deploy): [Soroban docs](https://soroban.stellar.org/docs/getting-started/setup)

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url> NexusFi && cd NexusFi
   pnpm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and fill in values (never commit .env)
   ```

   To run only the frontend or backend, use the `.env.example` files in `apps/frontend` and `apps/backend` as reference.

3. **Setup Stellar Testnet** (for deploying Soroban contracts)

   - Install [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup#install-the-soroban-cli): `cargo install soroban-cli`
   - Create a keypair and fund it on testnet (e.g. [Friendbot](https://laboratory.stellar.org/#account-creator?network=test)).
   - In `.env`, set `SOROBAN_RPC_URL`, `SOROBAN_NETWORK_PASSPHRASE`, and `SOROBAN_SECRET_KEY` (see `.env.example`; testnet values are pre-filled).
   - Full steps and verify commands: [Stellar Testnet setup](docs/stellar-testnet.md).

4. **Development**

   - Full stack (frontend + backend in parallel):
     ```bash
     pnpm dev
     ```
   - Frontend only: `pnpm dev:frontend` → http://localhost:3000  
   - Backend only: `pnpm dev:backend` → http://localhost:3001  

5. **Build**

   ```bash
   pnpm build
   ```

6. **Contracts (Soroban)**

   ```bash
   cd contracts && cargo test && cargo build --release --target wasm32-unknown-unknown
   ```

## Main scripts (root)

| Script              | Description                          |
|---------------------|--------------------------------------|
| `pnpm dev`          | Runs frontend and backend in dev     |
| `pnpm dev:frontend` | Next.js only                         |
| `pnpm dev:backend`  | Express API only                     |
| `pnpm build`        | Build all workspaces                 |
| `pnpm lint`         | Lint all packages                    |
| `pnpm test`         | Run tests in all packages            |

## CRE workflows

Chainlink CRE workflow is in **`workflows/cre/`**. From repo root:

```bash
cd workflows/cre && bun install
cre workflow simulate ./workflows/cre --target=staging-settings
```

See [workflows/cre/README.md](workflows/cre/README.md) for setup and [workflows/README.md](workflows/README.md) for the workflows overview.

## Security

- **Never** commit `.env`, `secrets.yaml`, or any file containing secrets.
- All sensitive keys (API, Soroban, Chainlink) come from environment variables or local, gitignored `secrets.yaml`.
- The root `.gitignore` excludes `secrets.yaml`, `**/secrets.yaml`, and `nexusfi/`; keep CRE secrets only in `workflows/cre/.env` or `workflows/cre/secrets.yaml` (both gitignored).
- Development and production configs should be separate (e.g. `NODE_ENV`, different URLs).

## Documentation

- [Architecture](docs/architecture.md)
- [Backend API](docs/api.md)
- [Deployment](docs/deployment.md)
- [Stellar Testnet setup](docs/stellar-testnet.md)
- [Soroban contracts](contracts/README.md)
- [Workflows overview](workflows/README.md) · [CRE workflow (workflows/cre)](workflows/cre/README.md)

## License

Private / per hackathon rules.
