# 👻 GhostLaw

**AI that fights every bill, contract, and phone call for you.**

Scan any document → AI finds overcharges & hidden traps → Generates dispute letters → Creates phone call scripts to win your money back.

## Features

- 📄 **Smart Scan** — Upload or paste any bill, contract, lease, or fine. AI identifies every issue, overcharge, and your legal rights.
- ⚖️ **Dispute Generator** — One-click dispute letters in firm, aggressive, or friendly tones. Ready to send.
- 📞 **Ghost Call** — AI-generated phone scripts with negotiation tactics, escalation phrases, and what to say word-for-word.
- 📊 **Dashboard** — Track your scans, disputes, and total savings.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Python, FastAPI, Uvicorn |
| AI | Google Gemini 2.0 Flash (free tier) |
| Auth | JWT (python-jose) |
| Deploy | Vercel (both frontend + backend) |

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload

# Frontend
cd app
npm install
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get profile |
| POST | `/scan/upload` | Scan document image |
| POST | `/scan/text` | Scan pasted text |
| GET | `/scan/history` | Scan history |
| POST | `/dispute/generate` | Generate dispute letter |
| POST | `/call/request` | Generate call script |
| GET | `/dashboard/stats` | Dashboard stats |

## Environment Variables

```
GEMINI_API_KEY=     # Google AI Studio (free)
JWT_SECRET=         # Any random string
```

## License

MIT
