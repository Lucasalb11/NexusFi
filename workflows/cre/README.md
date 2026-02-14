# NexusFi - CRE Workflow

Chainlink CRE (Request & Receive) workflow for NexusFi. Cron example runs on a schedule (e.g. every 30s in staging).

## Prerequisites

- [Bun](https://bun.sh/) (or Node.js; CRE CLI may use Bun for setup)
- Chainlink CRE CLI and account (see [CRE docs](https://docs.chain.link/chainlink-automation))

## Setup

1. **Environment**

   Copy the example env and add your keys (never commit `.env`):

   ```bash
   cp .env.example .env
   ```

   If your workflow needs secrets for the CRE runner, create `secrets.yaml` in this directory (see `secrets.yaml.example`). This file is **gitignored**.

2. **Install dependencies**

   From this directory:

   ```bash
   cd workflows/cre && bun install
   ```

3. **Simulate the workflow**

   From the **repository root**:

   ```bash
   cre workflow simulate ./workflows/cre --target=staging-settings
   ```

## Structure

- `main.ts` – Workflow entry (cron trigger + handler)
- `config.staging.json` / `config.production.json` – Schedule and config per target
- `workflow.yaml` – CRE workflow settings (workflow name, paths)
- `project.yaml` – CRE project settings (RPCs, etc.)

## Security

- Never commit `.env` or `secrets.yaml`.
- Use the root monorepo `.env.example` for shared vars; Chainlink keys only in env or `secrets.yaml` (local).
