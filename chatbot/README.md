# Chatbot

This folder contains the UniMarket chatbot backend service used by the main Next.js app.

## Prerequisites
- Node.js 18+
- Gemini API key with access to a chat-capable model

## Setup
1. Install dependencies:
   - `npm --prefix chatbot install`
2. Copy `chatbot/.env.example` to `chatbot/.env`
3. Configure environment variables in `chatbot/.env`:
   - `GEMINI_API_KEY` (required)
   - `GEMINI_MODEL` (optional, default `gemini-2.0-flash`)
   - `PORT` (optional, default `5050`)

## Run
- Development:
  - `npm run chat:dev`
- Build:
  - `npm run chat:build`
- Start built server:
  - `npm run chat:start`
