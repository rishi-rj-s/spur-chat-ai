# Spur Chat Agent

> A robust, production-ready customer support AI agent for live chat widgets

**Spur Chat Agent** is an AI-powered chat system that combines intelligent responses with enterprise-grade reliability. Built for real-world customer support scenarios, it prioritizes stability and user experience without sacrificing modern features.

---

## What It Does

**Intelligent Conversations** — Powered by Google Gemini with built-in domain knowledge for shipping, returns, and customer service scenarios.

**Session Memory** — Redis-backed sessions maintain conversation context for 30 minutes, ensuring smooth multi-turn interactions.

**Complete History** — Every message is persisted to PostgreSQL, giving you full audit trails and conversation history.

**Visual Flexibility** — Three beautiful themes (Light, Dark, and Glass) that users can switch between instantly.

**Battle-Tested Reliability** — Input validation with Zod, rate limiting, message caps (100 per session), character limits (250), and graceful error handling with toast notifications.

---

## Technology

**Frontend Stack** — SvelteKit provides the reactive UI framework, styled with TailwindCSS. Lucide Icons for crisp visuals, and Svelte French Toast for notifications.

**Backend Stack** — Fastify powers the API layer with TypeScript throughout. Zod handles runtime validation and type safety.

**Data Layer** — PostgreSQL (via Prisma ORM) stores conversations permanently. Redis (via IORedis) manages ephemeral session state.

**AI Integration** — Google Gemini via the official `@google/generative-ai` SDK.

**Development** — Docker Compose orchestrates local services. Prettier and ESLint maintain code quality.

---

## Getting Started Locally

**Before You Begin** — Install Node.js 20+, pnpm (or npm), and Docker Desktop.

**Step 1: Start Your Databases**

Fire up PostgreSQL and Redis in containers:

```bash
docker-compose up -d
```

This spins up Postgres on port 5432 and Redis on 6379.

**Step 2: Configure the Backend**

Navigate to the server directory and install dependencies:

```bash
cd server
pnpm install
pnpm db:pushAndGenerate
```

Create `server/.env` with your configuration:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spur_chat?schema=public"
REDIS_URL="redis://localhost:6379"
GEMINI_API_KEY="YOUR_GEMINI_KEY"
PORT=3000
```

Launch the backend server:

```bash
pnpm dev
```

**Step 3: Launch the Frontend**

In a new terminal, set up the UI:

```bash
cd frontend
pnpm install
pnpm dev
```

Visit **http://localhost:5173** to see your chat agent in action.

---

## How It's Built

**Project Structure** — The monorepo contains separate `frontend` and `server` directories, keeping concerns cleanly separated while allowing shared tooling.

**Backend Architecture** — The `routes/` directory exposes API endpoints like `/chat/message`. Business logic lives in `services/`, including the LLM integration layer. Database models are defined in `prisma/schema.prisma`.

**Frontend State Management** — Global theme state uses Svelte 5's modern runes in `theme.svelte.ts`. The `api.ts` module provides a typed Fetch wrapper with built-in error interception and handling.

---

## 🌐 Deploying to Production

**Database Setup**

For **PostgreSQL**, provision a managed instance from Neon.tech or Supabase. For **Redis**, Upstash offers a generous free tier perfect for session storage.

**Backend Deployment**

Deploy the `server` directory to Render, Railway, or your preferred Node.js host. Configure these environment variables in your hosting dashboard:

- `DATABASE_URL` — Your Postgres connection string
- `REDIS_URL` — Your Redis connection string  
- `GEMINI_API_KEY` — Your Google AI API key

Set the start command to `pnpm start` and ensure your build script runs TypeScript compilation.

**Frontend Deployment**

Deploy the `frontend` directory to Vercel, Netlify, or Cloudflare Pages. Set one environment variable:

- `PUBLIC_API_BASE_URL` — Your backend URL (e.g., `https://my-api.onrender.com`)

The build command should be `pnpm build` with the output directory set to `build/`.

---

## 🧠 Architecture & Design Notes

### Backend Structure
- **Service-Oriented**: Core logic (LLM, DB) is separated into `services/` to keep `routes/` clean and focused on HTTP handling.
- **Validation First**: Every endpoint uses Zod schemas to validate input before processing, preventing "garbage in" and checking limits early.
- **Dual-Layer Persistence**: 
  - **Redis** handles high-speed, short-term session state (is the user active? cached history).
  - **PostgreSQL** handles long-term, reliable storage of every message for audit and analytics.

### LLM Implementation
- **Provider**: Google Gemini (`gemini-2.5-flash`) via the new `@google/genai` SDK.
- **Optimization**: We use the Flash model for extremely low latency, which is critical for chat interfaces.
- **Context Management**: The backend manages a sliding window of the last 10 messages to maintain context without overflowing token limits or slowing down responses.
- **Prompting**: A robust System Prompt defines the persona ("Spur Support") and strictly bounds the knowledge to Shipping, Returns, and Products to prevent hallucinations.

---

## 🔮 Trade-offs & Future Improvements

**If I had more time...**

1.  **Strict Security & Auth**: 
    Currently, sessions are anonymous and secured only by the random UUID. Security could be significantly improved by:
    -   Implementing **IP Fingerprinting** (binding sessions to IP addresses).
    -   Moving from `sessionStorage` to **Signed, HttpOnly Cookies**.
    -   Adding a proper user authentication layer (Login/Signup).

2.  **Streaming Responses**: 
    The current implementation waits for the full AI response before sending it. Implementing **Server-Sent Events (SSE)** or **WebSocket streaming** would make the chat feel much more alive and faster.

3.  **RAG Integration**: 
    Instead of hardcoding policies in the prompt, I would integrate a Vector Database (like pgvector) to dynamically retrieve specific help articles based on the user's query.

4.  **Admin Dashboard**: 
    A simple admin view to see live chats, take over conversations from the AI, and view usage statistics.