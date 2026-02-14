# API - NexusFi Backend

## Base URL

- Desenvolvimento: `http://localhost:3001`
- Produção: configurável via `NEXT_PUBLIC_API_URL` (frontend) e variável de ambiente no backend.

## Endpoints

### Health check

- **GET** `/health`
- Resposta: `{ "status": "ok", "timestamp": "<ISO8601>" }`

---

Endpoints adicionais (auth, contratos, oráculos) devem ser documentados aqui conforme forem implementados.
