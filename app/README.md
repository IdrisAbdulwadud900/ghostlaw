# GhostLaw Frontend

Frontend for GhostLaw's dispute-recovery product.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT_MS=25000
```

## Quality checks

```bash
npm run lint
npm run build
```

## Key modules

- `components/AppDashboard.tsx`: core user journey (scan → dispute → call → complaint)
- `lib/api.ts`: API wrapper with auth, timeout, retry, and local persistence helpers
