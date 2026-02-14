# GPT_ChatBot

This folder contains the UniMarket chatbot backend service used by the main Next.js app.

## Structure
- `backend/` - Express + OpenAI API (`POST /api/chat`, `GET /health`)

## Prerequisites
- Node.js 18+
- OpenAI API key with access to a chat-capable model

## Setup
1. Install dependencies:
   - `npm --prefix GPT_ChatBot/backend install`
2. Copy `GPT_ChatBot/backend/.env.example` to `GPT_ChatBot/backend/.env`
3. Configure environment variables in `GPT_ChatBot/backend/.env`:
   - `OPENAI_API_KEY` (required)
   - `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
   - `PORT` (optional, default `5050`)

## Run
- Development:
  - `npm run chat:dev`
- Build:
  - `npm run chat:build`
- Start built server:
  - `npm run chat:start`
