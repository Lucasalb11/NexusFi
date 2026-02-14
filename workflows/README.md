# NexusFi - Workflows (CRE)

Directory for **CRE** flows (Chainlink Request & Receive or custom workflows).

## Usage

- Place here scripts and workflow definitions that orchestrate:
  - Chainlink oracle calls
  - Backend ↔ Soroban contracts integration
  - Data pipelines (e.g. prices, events)

## Example future structure

```
workflows/
  definitions/   # YAML/JSON flow definitions
  scripts/       # Node/TS scripts to trigger jobs
  .env.example   # Variables for Chainlink operators, etc.
```

## Environment variables

Use the root monorepo `.env.example`; Chainlink keys must never be committed.
