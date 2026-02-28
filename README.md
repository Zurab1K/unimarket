# UniMarket

UniMarket is a student-focused campus marketplace web app built with Next.js. The current project includes authentication with Supabase, an onboarding flow, a homepage with featured listings, and an AI assistant powered by a separate Gemini-backed chatbot service.

This project was developed as part of the Stony Brook Computing Society Mentorship Program, "Project Quack".

Mentor: Zurabi Kochiashvili

Mentees: Ali Chen, Brian Cao, Dimash Madiyar, Gurami Janashia, Leo Dicello, Simon Kuang

Note: Names are listed in alphabetical order and are not intended to indicate contribution level.

## Project Overview

The repository is split into two main parts:

- The main app at the repo root is a Next.js 14 App Router frontend.
- The `chatbot/` folder contains a standalone Express + TypeScript backend that handles AI chat requests with Gemini.

## Current Features

- Supabase email/password authentication
- Temporary skip-auth flow for development/demo use
- Multi-step onboarding entry point at `/onboarding`
- Homepage with featured listing cards and client-side sorting
- Dedicated AI chat page at `/chat`
- Global floating chat widget rendered from the root layout
- Next.js API proxy at `/api/chat` that forwards requests to the chatbot backend

## Current State

Some parts of the product are implemented as working UI flows, while others are still scaffolded:

- `app/login/page.tsx` handles sign up and log in with Supabase.
- `app/onboarding/page.tsx` renders the onboarding survey flow.
- `app/home/page.tsx` contains the current homepage and featured listing experience.
- `app/chat/page.tsx` provides the full-page AI assistant UI.
- `app/listings/page.tsx` and `app/forums/page.tsx` are still placeholder pages.
- `models/` and `lib/db.ts` show planned PostgreSQL/Sequelize data-layer work, but that layer is not yet wired into the main UI flow.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- Express
- Gemini via `@google/genai`
- Sequelize + PostgreSQL scaffolding

## Repository Layout

- `app/` - Next.js routes, layouts, global styles, and the `/api/chat` proxy route
- `components/` - shared UI components such as the navbar, listing cards, onboarding survey, and chat widget
- `lib/` - Supabase client, auth guard, and database connection scaffolding
- `models/` - Sequelize models for users, listings, messages, and reviews
- `chatbot/` - standalone Gemini chatbot backend

## Environment Variables

Root app:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
CHAT_API_URL=http://localhost:5050/api/chat
```

Chatbot backend:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
PORT=5050
```

## Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Copy the root environment template:

```bash
cp .env.example .env
```

3. Install chatbot dependencies:

```bash
npm --prefix chatbot install
```

4. Copy the chatbot environment template:

```bash
cp chatbot/.env.example chatbot/.env
```

5. Fill in the required Supabase and Gemini environment variables.

## Running Locally

Start the chatbot backend:

```bash
npm run chat:dev
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

The chatbot backend runs on `http://localhost:5050` by default.

## Available Scripts

Root scripts:

- `npm run dev` - start the Next.js app
- `npm run build` - build the Next.js app
- `npm run start` - start the production Next.js build
- `npm run lint` - run Next.js linting
- `npm run chat:dev` - start the chatbot backend in development
- `npm run chat:build` - build the chatbot backend
- `npm run chat:start` - start the built chatbot backend

## Typical Local Flow

1. Start the chatbot backend.
2. Start the Next.js app.
3. Visit `/login`.
4. Sign in, sign up, or use the temporary skip flow.
5. Complete onboarding.
6. Browse the homepage or open the AI chat experience.

## Notes

- The chatbot UI calls the Next.js API route at `/api/chat`, not the Gemini backend directly.
- `CHAT_API_URL` should point to the chatbot service.
- Port `5050` is used by default to avoid common conflicts with macOS AirPlay on port `5000`.

## Troubleshooting

- If chat fails, confirm the chatbot backend is running and `GEMINI_API_KEY` is set in `chatbot/.env`.
- If the frontend cannot reach chat, confirm `CHAT_API_URL` matches the chatbot port.
- If port `3000` is busy, run the frontend with `PORT=3001 npm run dev`.
- If TypeScript shows unresolved imports inside `chatbot/`, install chatbot dependencies with `npm --prefix chatbot install`.
