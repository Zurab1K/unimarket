# UniMarket – Dev Guide

## What this project is
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind, located at the repo root.
- Auth flow (current state): email/password via Supabase client; after login you’re sent to the onboarding survey, then to the homepage. A temporary “Skip” button exists while auth is being finalized.
- Onboarding: multi-step survey (campus, interests, budget) at `/onboarding`.
- Homepage: hero + featured listings grid at `/home`.
- AI Chat: `/chat` page calls a separate chatbot backend via `/api/chat`.
- Chatbot backend: Express + OpenAI in `GPT_ChatBot/backend` (TypeScript).

## Prerequisites
- Node.js 18+
- npm
- An OpenAI API key for the chatbot backend

## Environment variables
Main app (`.env` in repo root, already present):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
CHAT_API_URL=http://localhost:5050/api/chat   # points to the chatbot backend
```

Chatbot backend (`GPT_ChatBot/backend/.env`):
```
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-4o-mini   # optional
PORT=5050                  # recommended to avoid macOS AirPlay on 5000
```

## Running the chatbot backend
```
npm --prefix GPT_ChatBot/backend install
npm run chat:dev
# should log: API ready on http://localhost:5050
```

## Running the main app
```
cd UniMarket   # or your cloned path
npm install
# if port 3000 is busy on your machine, run: PORT=3001 npm run dev
npm run dev
```
Then open the shown URL (default http://localhost:3000 or the port you set).

## Flow to test
1) Backend running on port 5050 (see above).
2) Main app running; visit `/` → login/skip → `/onboarding` → `/home`.
3) Click “AI Chat” in the navbar; messages proxy through `/api/chat` to the backend.

## Repo layout (relevant paths)
- `app/` – Next.js routes (`page.tsx` redirects to login, `/login`, `/onboarding`, `/home`, `/chat`, `/listings`, `/forums`).
- `components/` – shared UI (Navbar, ListingCard, OnboardingSurvey, etc.).
- `lib/useAuthGuard.ts` – client guard for auth/onboarding.
- `app/api/chat/route.ts` – proxy to the chatbot backend at `CHAT_API_URL`.
- `GPT_ChatBot/backend/` – Express + OpenAI chatbot API.

## Troubleshooting
- Chat returns empty/“couldn’t generate”: ensure backend is running, `OPENAI_API_KEY` is set, and `CHAT_API_URL` matches the backend port (5050 by default). macOS AirPlay blocks port 5000—use 5050.
- Port in use: set `PORT=<other>` before `npm run dev` for the main app.
