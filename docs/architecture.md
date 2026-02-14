# Arquitetura - NexusFi

## Visão geral

NexusFi é um monorepo que agrupa:

| Camada        | Stack        | Descrição                          |
|---------------|-------------|------------------------------------|
| **Frontend**  | Next.js 14  | Interface web (App Router, React)  |
| **Backend**   | Node.js + Express | API REST e orquestração        |
| **Contracts** | Soroban (Rust) | Smart contracts na Stellar     |
| **Workflows** | CRE / scripts | Integração Chainlink e pipelines |

## Fluxo de dados

```
[Browser] <-> [Next.js] <-> [Backend API] <-> [Soroban RPC / Chainlink]
                    |
                    v
              [Contratos Soroban]
```

## Configuração

- **Desenvolvimento:** `.env` local (nunca commitado), `NODE_ENV=development`.
- **Produção:** variáveis no ambiente do host/CI; separar URLs e chaves por ambiente.

## Segurança

- Secrets apenas em variáveis de ambiente.
- Backend valida e assina operações sensíveis; frontend nunca recebe chaves privadas.
- Contratos seguem boas práticas Soroban (checks-effects-interactions, acesso restrito).
