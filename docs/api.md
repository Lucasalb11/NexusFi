# API - NexusFi Backend

## Base URL

- Development: `http://localhost:3001`
- Production: configurable via `NEXT_PUBLIC_API_URL` (frontend) and environment variable on the backend.

## Endpoints

### Health check

- **GET** `/health`
- Response: `{ "status": "ok", "timestamp": "<ISO8601>" }`

---

Additional endpoints (auth, contracts, oracles) should be documented here as they are implemented.
