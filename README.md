# TN College Research Assistant

A full-stack web app for researching Tamil Nadu engineering colleges — search by name, code, or cutoff mark, compare up to 5 colleges side-by-side, get AI-powered summaries, and export to CSV or Word.

## Stack

| Layer | Tech |
|-------|------|
| Frontend (web) | React 19 + Vite + Tailwind CSS |
| Mobile | React Native + Expo SDK 54 (Android) |
| Backend | FastAPI (Python 3.11) |
| AI | Anthropic Claude (Haiku / Sonnet) |
| Data | TNEA official cutoff data (2024–2026) |
| Deployment | Render (backend + web) · EAS Build (mobile APK) |

## Features

- Search colleges by name (fuzzy), TNEA code, or cutoff mark
- Multi-course cutoff search — select any combination of branches
- Multi-year cutoff tabs: 2024 actual / 2025 expected / 2026 AI-predicted
- Google Reviews + YouTube summaries via Claude AI
- Favorites with branch-level selection and CSV & Word export (TNEA format)
- Side-by-side college comparison (up to 5)
- **College Buddy** — AI chat assistant with college context
- Native Android app with AsyncStorage favorites persistence

---

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

### Web Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8001/api
npm run dev
# → http://localhost:5173
```

### Mobile App (Android)

Requires the **Expo Go** app installed on your Android device.

```bash
cd mobile
npm install
npx expo start
# Scan the QR code with Expo Go on your Android device
```

---

## Deployment

### Backend + Web → Render (auto-deploys on push)

Both services are defined in `render.yaml`. Every push to `master` triggers an automatic redeploy on Render.

**First-time setup:**

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render auto-detects `render.yaml` and creates all services
4. Set the following environment variables manually in the Render dashboard (marked `sync: false` in `render.yaml`):

| Service | Variable | Value |
|---------|----------|-------|
| `tn-college-backend` | `ANTHROPIC_API_KEY` | your key |
| `tn-college-backend` | `GOOGLE_PLACES_API_KEY` | your key |
| `tn-college-backend` | `YOUTUBE_API_KEY` | your key |
| `tn-college-backend` | `CORS_ORIGIN` | `https://tn-college-frontend.onrender.com` |
| `tn-college-frontend` | `VITE_API_URL` | `https://tn-college-backend.onrender.com/api` |
| `tn-college-keepalive` | `BACKEND_URL` | `https://tn-college-backend.onrender.com` |

> **Note:** Free tier backend sleeps after 15 min of inactivity. The `tn-college-keepalive` cron job pings `/health` every 14 minutes to keep it awake.

---

### Mobile App → Android APK / Google Play

The mobile app uses **Expo Application Services (EAS)** to build a native Android APK or AAB in the cloud — no Android Studio or Mac required.

#### Step 1 — Install EAS CLI

```bash
npm install -g eas-cli
eas login   # create a free account at expo.dev if you don't have one
```

#### Step 2 — Configure EAS (first time only)

```bash
cd mobile
eas build:configure
```

This links the project to your Expo account and creates/updates `eas.json`.

#### Step 3 — Build

**Option A — APK for direct install (sideloading)**

Best for internal testing; no Play Store account needed.

```bash
cd mobile
eas build --platform android --profile preview
```

Queues a cloud build (~5–10 min). When done, EAS prints a download link for the `.apk`.

**Option B — AAB for Google Play Store**

```bash
cd mobile
eas build --platform android --profile production
```

Produces a `.aab` bundle signed with your keystore, ready for Play Store upload.

#### Step 4 — Install the APK (Option A)

1. Download the `.apk` from the link printed by EAS (or from [expo.dev](https://expo.dev) → your project → Builds)
2. Transfer to your Android device (USB, Google Drive, WhatsApp, etc.)
3. On the device: **Settings → Install unknown apps** → allow your file manager or browser
4. Tap the `.apk` to install — the app appears as **TN College Research**

#### Step 5 — Publish to Google Play (Option B)

```bash
eas submit --platform android
# Prompts for your Google Play service account JSON, then uploads automatically
```

Or upload the `.aab` manually in the [Google Play Console](https://play.google.com/console) under **Production → Create new release**.

#### Updating the backend URL

The mobile app points to the production backend at `mobile/src/constants/api.ts`:

```typescript
export const BASE_URL = 'https://tn-college-backend.onrender.com/api';
```

If you deploy the backend to a different URL, update this constant and rebuild with EAS.

## Security

- Rate limiting: 120 req/min global; 30/min on research; 20/min on chat
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `HSTS` (production only)
- CORS locked to configured origin in production
- OpenAPI docs disabled in production
- Input validation + length limits on all endpoints
- No secrets committed — all keys via environment variables

## License

For educational purposes only. See [Terms & Conditions](frontend/src/components/LegalModal.jsx).
