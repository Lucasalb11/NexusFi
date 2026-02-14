# NexusFi

Monorepo for the **NexusFi** project (Next.js frontend, Node.js backend, Soroban/Rust contracts, and CRE workflows).

## Repository structure

```
nexusfi/
├── apps/
│   ├── frontend/     # Next.js 14 (App Router, TypeScript, Tailwind)
│   └── backend/      # Node.js + Express (REST API)
├── contracts/        # Soroban (Rust) - Stellar smart contracts
├── workflows/        # CRE / workflows (Chainlink, pipelines)
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
   cd "Chainlink-convergence-Hackaton"
   pnpm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and fill in values (never commit .env)
   ```

   To run only the frontend or backend, use the `.env.example` files in `apps/frontend` and `apps/backend` as reference.

3. **Development**

   - Full stack (frontend + backend in parallel):
     ```bash
     pnpm dev
     ```
   - Frontend only: `pnpm dev:frontend` → http://localhost:3000  
   - Backend only: `pnpm dev:backend` → http://localhost:3001  

4. **Build**

   ```bash
   pnpm build
   ```

5. **Contracts (Soroban)**

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

## Security

- **Never** commit `.env` or files containing secrets.
- All sensitive keys (API, Soroban, Chainlink) come from environment variables.
- Development and production configs should be separate (e.g. `NODE_ENV`, different URLs).

## Documentation

- [Architecture](docs/architecture.md)
- [Backend API](docs/api.md)
- [Deployment](docs/deployment.md)
- [Soroban contracts](contracts/README.md)
- [CRE workflows](workflows/README.md)

## License

Private / per hackathon rules.
