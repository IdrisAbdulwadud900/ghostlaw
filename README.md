# GhostLaw

GhostLaw helps people recover money from unfair charges and abusive business practices.

## Core flow

1. Scan or paste a bill/message/contract.
2. Get a legal analysis with rights + action plan.
3. Generate dispute letter and call script.
4. Escalate to regulator complaint flow.

## Tech stack

- Frontend: Next.js 16 + TypeScript
- Backend: FastAPI + Python
- AI: Google Gemini (with model fallback)
- Data: Supabase (with in-memory fallback for dev)

## Local setup

Backend:

```bash
cd backend
python -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

Frontend:

```bash
cd app
npm install
npm run dev
```

## Required environment variables

Backend:

- `GEMINI_API_KEY`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID` (required for strict Google token verification)
- `APPLE_CLIENT_ID` (required for strict Apple token verification)
- `SUPABASE_URL` / `SUPABASE_KEY` (optional but recommended)
- `CORS_ORIGINS` (comma-separated allowed origins)

Frontend:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_TIMEOUT_MS` (optional, default 25000)

## API highlights

- Auth: `/auth/signup`, `/auth/login`, `/auth/social`, `/auth/me`
- Scan: `/scan/upload`, `/scan/text`, `/scan/history`
- Dispute: `/dispute/generate`
- Call: `/call/request`
- Complaints: `/complaint/generate`
- Privacy: `/privacy/export`, `/privacy/delete`

## Security notes

- Social login ID tokens are verified against provider JWKS.
- Production requires strong `JWT_SECRET`.
- CORS is allowlist-based.
- Responses include `X-Request-ID` for tracing errors.
