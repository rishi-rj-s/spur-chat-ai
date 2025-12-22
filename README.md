# Spur Chat Agent

> A "boring but robust" customer engagement AI agent.

This project is a submission for the Spur Founding Full-Stack Engineer role. It implements a resilient, production-ready chat widget powered by Google Gemini, focused on reliability and user experience over flashy, brittle features.
  

---
## 🚀 Quick Start  

### Prerequisites

- Node.js 20+

- pnpm (or npm)

- Docker Desktop (optional, for easy DB setup)

- A Google Gemini API Key
  

### 1. Database Setup

I used **Docker** to spin up PostgreSQL and Redis locally. You can do the same, or use your own managed instances (Neon, Supabase, Upstash, etc.).  

**Option A: Using Docker (Recommended)**

```bash

# Spins up Postgres (port 5432) and Redis (port 6379)

docker-compose  up  -d

```

**Option B: Bring Your Own DB**

If you aren't using Docker, just ensure you have connection strings for a Postgres database and a Redis instance ready for the next step.  

### 2. Backend Setup

```bash

cd  server
pnpm  install  

# Create .env file
cp  .env.example  .env

# OR create manually:

# DATABASE_URL="postgresql://user:pass@localhost:5432/spur_chat?schema=public
# REDIS_URL="redis://localhost:6379"
# GEMINI_API_KEY="your_google_ai_key"
# PORT=3000  

# Push Prisma schema to DB
pnpm  db:push

```
Start the server:

```bash
pnpm  dev
```

### 3. Frontend Setup

In a new terminal:
```bash
cd  frontend
pnpm  install

# IMPORTANT: Ensure your .env files are verified as UTF-8 encoding.
# SvelteKit/Vite may fail to read it otherwise.

pnpm  dev
```
Visit **http://localhost:5173** to chat.  

---

## 🧠 Architecture & Design Decisions

My design philosophy for this task was **"Robustness First."** I wanted to build something that wouldn't crash on weird input and felt fast even on slow networks.

### Backend (Node.js + Fastify + TypeScript)

-  **Fastify**: Chosen over Express for better performance and lower overhead.
-  **Service Layer Pattern**: Separated `routes/` (HTTP handling) from `services/` (Business Logic/LLM). This makes it easy to swap out the LLM provider later or add new channels (WhatsApp, IG) without rewriting the API layer.
-  **Zod Validation**: Every endpoint validates inputs strictly. We don't trust the client.
-  **Double Persistence Strategy**:

1.  **Redis (Cache)**: Used for extremely fast session checks and "hot" history retrieval. It keeps the chat feeling instant on reloads.
2.  **PostgreSQL (Source of Truth)**: Every message is strictly logged for audit trails and long-term storage.

### Frontend (SvelteKit + Tailwind)

-  **Svelte 5 Runes**: Used for simple, reactive global state management (Themes, Session ID).
-  **Optimistic UI**: Messages appear instantly while the backend processes, making the app feel snappier.
-  **Resiliency**: Handles network errors gracefully with toast notifications instead of silent failures.  

### LLM Integration

-  **Provider**: Google Gemini (`gemini-2.5-flash-lite`) via `@google/genai`.
-  **Why Flash?**: It offers the best balance of extremely low latency (critical for chat) and sufficient reasoning capability for support tasks.
-  **Prompt Engineering**: The system prompt is "hard-bounded." I explicitly instruct it *what it knows* (Shipping, Returns) and *what it doesn't*, reducing hallucinations.
-  **Context Window**: We slide the context window (last 10 messages) to keep costs low and responses relevant.
---

## 🔮 Trade-offs & "If I had more time..."

1.  **Security & Auth**:

*  *Current*: Anonymous sessions via UUID stored in `sessionStorage`.
*  *Upgrade*: I would implement **IP Fingerprinting** to bind sessions to device IPs or use **Signed HTTP-only cookies** to prevent session hijacking.
  

2.  **Streaming Responses**:

*  *Current*: Waits for full generation (simplest to implement reliably).
*  *Upgrade*: Implement **Server-Sent Events (SSE)** to stream tokens byte-by-byte for a "live typing" feel.  

3.  **RAG (Retrieval-Augmented Generation)**:

*  *Current*: Policies are hardcoded in the system prompt.
*  *Upgrade*: Integrate `pgvector` to dynamically pull relevant help articles (e.g., "How do I return a shirt?") into the context, allowing the knowledge base to grow without changing code.  

4.  **Admin Dashboard**:

* A simple view for support agents to take over conversations when the AI gets stuck.
---

## 📂 Project Structure

```
spur-chat-test/
├── server/
│ ├── src/
│ │ ├── routes/ # API Endpoints (Chat, History)
│ │ ├── services/ # Business Logic (LLM Wrapper)
│ │ └── index.ts # Entry point
│ └── prisma/ # DB Schema
|
└── frontend/
| └── src/
|   ├── routes/ # Svelte Pages
|   └── lib/ # Shared Utilities (API client, Theme store)
|
└── docker-compose.yml
```