# NexusFi - Workflows (CRE)

Directory for **CRE** (Chainlink Request & Receive) workflows and related automation.

## Structure

```
workflows/
├── cre/                    # Chainlink CRE workflow (NexusFi)
│   ├── main.ts              # Workflow entry (cron + handler)
│   ├── config.staging.json
│   ├── config.production.json
│   ├── workflow.yaml        # CRE workflow settings
│   ├── project.yaml         # CRE project settings (RPCs)
│   ├── .env.example
│   ├── secrets.yaml.example # Template; copy to secrets.yaml (gitignored)
│   └── README.md
└── README.md
```

## CRE workflow

The NexusFi CRE workflow lives in **`workflows/cre/`**. See [workflows/cre/README.md](cre/README.md) for:

- Prerequisites (Bun, CRE CLI)
- Setup (`.env`, optional `secrets.yaml`)
- How to simulate: `cre workflow simulate ./workflows/cre --target=staging-settings`

## Security

- Never commit `.env` or `secrets.yaml` (in any workflow directory).
- Use the root monorepo `.env.example` for shared vars; Chainlink/CRE keys only in env or local `secrets.yaml`.
