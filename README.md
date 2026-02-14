# NexusFi

Monorepo do projeto **NexusFi** (Frontend Next.js, Backend Node.js, contratos Soroban/Rust e workflows CRE).

## Estrutura do repositório

```
nexusfi/
├── apps/
│   ├── frontend/     # Next.js 14 (App Router, TypeScript, Tailwind)
│   └── backend/      # Node.js + Express (API REST)
├── contracts/        # Soroban (Rust) - smart contracts Stellar
├── workflows/        # CRE / workflows (Chainlink, pipelines)
├── docs/             # Documentação técnica
├── package.json      # Root (pnpm workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example      # Exemplo de variáveis (copiar para .env)
└── README.md
```

## Pré-requisitos

- **Node.js** >= 18
- **pnpm** >= 8 (`npm install -g pnpm`)
- **Rust** (para contratos): [rustup.rs](https://rustup.rs)
- **Soroban CLI** (opcional, para deploy): [Soroban docs](https://soroban.stellar.org/docs/getting-started/setup)

## Setup

1. **Clonar e instalar dependências**

   ```bash
   cd "Chainlink- convergence- Hackaton"
   pnpm install
   ```

2. **Variáveis de ambiente**

   ```bash
   cp .env.example .env
   # Editar .env e preencher valores (nunca commitar .env)
   ```

   Para rodar apenas frontend ou backend, pode usar os `.env.example` em `apps/frontend` e `apps/backend` como referência.

3. **Desenvolvimento**

   - Tudo (frontend + backend em paralelo):
     ```bash
     pnpm dev
     ```
   - Só frontend: `pnpm dev:frontend` → http://localhost:3000  
   - Só backend: `pnpm dev:backend` → http://localhost:3001  

4. **Build**

   ```bash
   pnpm build
   ```

5. **Contratos (Soroban)**

   ```bash
   cd contracts && cargo test && cargo build --release --target wasm32-unknown-unknown
   ```

## Scripts principais (raiz)

| Script            | Descrição                          |
|-------------------|------------------------------------|
| `pnpm dev`        | Sobe frontend e backend em dev     |
| `pnpm dev:frontend` | Apenas Next.js                   |
| `pnpm dev:backend`  | Apenas API Express               |
| `pnpm build`      | Build de todos os workspaces       |
| `pnpm lint`       | Lint em todos os pacotes           |
| `pnpm test`       | Testes em todos os pacotes         |

## Segurança

- **Nunca** commitar `.env` ou ficheiros com secrets.
- Todas as chaves sensíveis (API, Soroban, Chainlink) vêm de variáveis de ambiente.
- Configurações de desenvolvimento e produção devem estar separadas (ex.: `NODE_ENV`, URLs diferentes).

## Documentação

- [Arquitetura](docs/architecture.md)
- [API Backend](docs/api.md)
- [Deploy](docs/deployment.md)
- [Contratos Soroban](contracts/README.md)
- [Workflows CRE](workflows/README.md)

## Licença

Privado / conforme regras do hackathon.
