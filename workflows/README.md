# NexusFi - Workflows (CRE)

Diretório para fluxos **CRE** (Chainlink Request & Receive ou workflows customizados).

## Uso

- Coloque aqui scripts e definições de workflows que orquestram:
  - Chamadas a oráculos Chainlink
  - Integração backend ↔ contratos Soroban
  - Pipelines de dados (ex.: preços, eventos)

## Exemplo de estrutura futura

```
workflows/
  definitions/   # YAML/JSON de definição de fluxos
  scripts/       # Scripts Node/TS para disparar jobs
  .env.example   # Variáveis para operadores Chainlink, etc.
```

## Variáveis de ambiente

Use o `.env.example` na raiz do monorepo; chaves Chainlink nunca devem ser commitadas.
