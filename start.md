# How to Run

## 1. Set up environment variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/`:

```
backend/.env
  GOOGLE_PLACES_API_KEY=your_key
  YOUTUBE_API_KEY=your_key
  ANTHROPIC_API_KEY=your_key
  CORS_ORIGIN=http://localhost:5173

frontend/.env
  VITE_API_URL=http://localhost:8000/api
```

## 2. Start Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

## 3. Start Frontend

```bash
cd frontend
npm run dev
# App: http://localhost:5173
```

## Notes
- Without API keys: search by name/code/cutoff works fully from seed data.
  Research (reviews, sentiment, score) will skip Google/YouTube/Claude
  and return seed data with a basic score.
- Add colleges to Favorites → use the Cutoffs toggle to show OC/BC/MBC... columns.
- Export CSV/Word calls the backend — backend must be running.
