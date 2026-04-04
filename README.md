# TN College Research Assistant

A full-stack web app for researching Tamil Nadu engineering colleges — search by name, code, or cutoff mark, compare up to 5 colleges side-by-side, get AI-powered summaries, and export to CSV or Word.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11) |
| AI | Anthropic Claude (Haiku / Sonnet) |
| Data | TNEA official cutoff data (2024–2026) |
| Deployment | Render (free tier) |

## Features

- Search colleges by name (fuzzy), TNEA code, or cutoff mark
- Multi-year cutoff tabs: 2024 actual / 2025 expected / 2026 AI-predicted
- Google Reviews + YouTube summaries via Claude AI
- Favorites grid with CSV & Word export (TNEA template format)
- Side-by-side college comparison (up to 5)
- **College Buddy** — AI chat assistant with college context

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # fill in your API keys
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8001/api
npm run dev
```

## Deployment (Render)

This repo includes a `render.yaml` blueprint for one-click deploy.

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. In the Render dashboard set these environment variables:

| Service | Variable | Value |
|---------|----------|-------|
| `tn-college-backend` | `ANTHROPIC_API_KEY` | your key |
| `tn-college-backend` | `GOOGLE_PLACES_API_KEY` | your key |
| `tn-college-backend` | `YOUTUBE_API_KEY` | your key |
| `tn-college-backend` | `CORS_ORIGIN` | `https://tn-college-frontend.onrender.com` |
| `tn-college-frontend` | `VITE_API_URL` | `https://tn-college-backend.onrender.com/api` |
| `tn-college-keepalive` | `BACKEND_URL` | `https://tn-college-backend.onrender.com` |

> **Note:** Free tier backend sleeps after 15 min of inactivity. The `tn-college-keepalive` cron pings `/health` every 14 minutes to keep it awake.

## Security

- Rate limiting: 120 req/min global; 30/min on research; 20/min on chat
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `HSTS` (production only)
- CORS locked to configured origin in production
- OpenAPI docs disabled in production
- Input validation + length limits on all endpoints
- No secrets committed — all keys via environment variables

## License

For educational purposes only. See [Terms & Conditions](frontend/src/components/LegalModal.jsx).
