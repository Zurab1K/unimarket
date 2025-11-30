Prerequisites

- Node.js 18+
- An OpenAI API key with access to a chat-capable model

Project layout

- 'backend/' – Express server that exposes '/api/chat' and forwards prompts to OpenAI.
- 'frontend/' – React single-page app that captures user input and calls the backend.

Setup

1. Installing dependencies

   'cd |backend folder path|' && 'npm install'
   'cd |frontend folder path|' && 'npm install'

2. Configure environment variables

- 'backend/.env'
  - 'OPENAI_API_KEY' – required; do not expose pls!!.
  - 'OPENAI_MODEL' – optional (defaults is 'gpt-4o-mini').
  - 'PORT' – optional local port (defaults is '5000').
- 'frontend/.env'
  - 'VITE_API_URL' – base URL for the backend (default is 'http://localhost:5000').

Running locally

- Starting the backend API from terminal:

  - 'cd |backend folder path|'
    'npm run dev'

- In a other terminal, starting the Vite dev server:

  - 'cd /Users/dimashmadiyar/Desktop/GPT_ChatBot/frontend'
    'npm run dev'

