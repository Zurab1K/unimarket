🌐 Project Description

Project Quack lets students:

Post and browse listings (textbooks, dorm items, services, and skills)

Swap or sell items securely

Chat in real time

Pay safely via Stripe or PayPal

Sign in with their SBU NetID

Get personalized AI-powered recommendations

```
Layout:
project-quack/
│
├── backend/                          # Server-side app (Next.js API or Express)
│   ├── src/
│   │   ├── app/                      # API routes if using Next.js app router
│   │   │   ├── api/
│   │   │   │   ├── listings/
│   │   │   │   ├── users/
│   │   │   │   ├── chat/
│   │   │   │   ├── payments/
│   │   │   │   └── reviews/
│   │   ├── lib/                      # Database / Auth / Stripe configs
│   │   ├── models/                   # Mongoose or Prisma schemas
│   │   ├── utils/                    # Helper functions
│   │   └── tests/                    # Jest tests
│   │
│   ├── .env.local
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── README.md
│
└── frontend/                         # Client-side app (React + Next.js)
    ├── app/                          # Next.js App Router pages
    │   ├── (routes)/
    │   │   ├── page.tsx              # Home page
    │   │   ├── browse/page.tsx       # Browse listings
    │   │   ├── chat/page.tsx         # Chat UI
    │   │   ├── sell/page.tsx         # Create/Edit listings
    │   │   └── account/page.tsx      # Profile / Settings
    │   ├── layout.tsx
    │   └── globals.css
    │
    ├── components/                   # UI building blocks
    │   ├── Navbar.tsx
    │   ├── Sidebar.tsx
    │   ├── SearchBar.tsx
    │   ├── ItemCard.tsx
    │   ├── ChatBox.tsx
    │   └── FormField.tsx
    │
    ├── lib/                          # Hooks, API wrappers
    ├── public/                       # Images, icons, logos
    ├── styles/                       # Custom CSS (if needed)
    ├── .env.local
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    └── README.md
```

🧰 Prerequisites

Make sure everyone has the following installed before running anything:

Tool	Recommended Version	Purpose
Node.js	≥ 18 (LTS 20 preferred)	Run Next.js & Tailwind
npm	≥ 9	Package manager
Git	Any	Version control
MongoDB Atlas or PostgreSQL	—	Database
VS Code	Latest	IDE (with ESLint + Prettier extensions)
Verify installation
node -v
npm -v
git --version

⚙️ Step 1 – Clone the Repository
git clone https://github.com/<your-org-or-username>/project-quack.git
cd project-quack

💻 Step 2 – Frontend Setup

The frontend runs on Next.js 14 + TypeScript + Tailwind.

1️⃣ Install dependencies
cd frontend
npm install

2️⃣ Create environment variables

Create a .env.local file in the frontend/ directory:

NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_KEY=pk_test_yourStripePublicKey


Everyone should create their own .env.local; it should never be committed to Git.

3️⃣ Run the frontend dev server
npm run dev -- --turbo


Visit http://localhost:3000
.

If Tailwind works, you should see styled text on the homepage.

4️⃣ Stack summary
Category	Technology
Framework	Next.js (App Router)
Language	TypeScript
Styling	Tailwind CSS
Bundler	Turbopack
Linting	ESLint + Prettier
⚙️ Step 3 – Backend Setup

The backend also uses Next.js (App Router API) but focuses on server logic, database, and auth.

1️⃣ Install dependencies
cd ../backend
npm install

2️⃣ Create environment variables

Create .env.local inside backend/:

DATABASE_URL=mongodb+srv://<username>:<password>@cluster-url/quackdb
JWT_SECRET=supersecretkey
STRIPE_SECRET_KEY=sk_test_yourStripeSecret
NEXTAUTH_SECRET=randomstring
NEXTAUTH_URL=http://localhost:3000


Use your personal MongoDB Atlas connection string.
Team leads may share a development database URL in Discord.

3️⃣ Run the backend server
npm run dev


Default endpoint: http://localhost:4000

⚡ Step 4 – Verify Full-Stack Connection

Make sure both servers are running:

Frontend: port 3000

Backend: port 4000

Open the browser console → Network tab.

Try visiting a frontend page that calls the API (e.g., /browse).

You should see API requests to localhost:4000/api/....

If you get CORS errors, add your frontend URL to the backend CORS whitelist.

🧩 Optional Tooling
Purpose	Tool	Install Command
API Testing	Postman	—
DB Viewer	MongoDB Compass / PgAdmin	—
Real-time Dev	Socket.io Client & Server	npm install socket.io socket.io-client
Auth	NextAuth.js	npm install next-auth
Payments	Stripe API SDK	npm install stripe
🧪 Step 5 – Lint and Format

Before committing:

npm run lint
npm run format


In VS Code, enable:

"editor.formatOnSave": true

👥 Step 6 – Team Workflow

Pull latest code

git pull origin main


Create your own branch

git checkout -b feature/<short-description>


Make changes in either frontend or backend.

Test locally (run both servers).

Commit your work

git add .
git commit -m "implement listing creation API"


Push your branch

git push origin feature/<short-description>


Open a pull request on GitHub.

At least one review is required before merging.
