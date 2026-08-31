# TraceFuse Production Deployment Guide (Section 30 & 36)

This document provides complete instructions for deploying TraceFuse to production across **Vercel** (Frontend), **Render / Railway** (FastAPI Backend), and **Supabase / Neon** (Managed PostgreSQL).

---

## 1. Environment Variables Matrix (Section 31)

Ensure `.env` is **never committed to git**. Configure the following environment variables directly in your cloud hosting provider dashboard:

| Variable | Platform | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres` | Managed Postgres connection string |
| `AI_API_KEY` | Backend | `gsk_xxxxxxxxxxxx` | Groq LLM API Key (optional; deterministic fallback active if omitted) |
| `AI_MODEL` | Backend | `llama-3.3-70b-versatile` | LLM model identifier |
| `AI_BASE_URL` | Backend | `https://api.groq.com/openai/v1` | Groq OpenAI-compatible base URL |
| `CORS_ORIGINS` | Backend | `https://tracefuse.vercel.app,http://localhost:3000` | Allowed frontend origins (or `*`) |
| `NEXT_PUBLIC_API_URL` | Frontend | `https://tracefuse-api.onrender.com` | Public URL of the deployed FastAPI backend |

---

## 2. Database Deployment (Supabase / Managed PostgreSQL)

1. Create a free project at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy the **Direct / Transaction Connection URI** (e.g. `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`).
3. Run the database seed script locally pointing to the remote DB:
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" python -m data.seed.generate_seed_data
   ```
4. Verify the database tables (`accounts`, `transactions`, `investigations`, `devices`, `entities`, etc.) and all 9 scenarios landed properly in the Supabase Table Editor.

---

## 3. Backend Deployment (Render / Railway / Fly.io)

### Option A: Render (Blueprint or Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect `harshsingh2275/Tracefuse` GitHub repository.
3. Configure settings:
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn apps.api.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Supabase connection string)*
   - `AI_API_KEY`: *(Your Groq API key)*
   - `AI_MODEL`: `llama-3.3-70b-versatile`
   - `AI_BASE_URL`: `https://api.groq.com/openai/v1`
   - `CORS_ORIGINS`: `*`
5. Click **Deploy**. Note down your backend service URL (e.g., `https://tracefuse-api.onrender.com`).

### Option B: Railway
1. Go to [Railway](https://railway.app) and select **New Project** $\rightarrow$ **Deploy from GitHub repo**.
2. Railway detects the `Dockerfile` / `Procfile` automatically.
3. Add the environment variables under **Variables** tab.

---

## 4. Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** $\rightarrow$ **Project**.
2. Import the `harshsingh2275/Tracefuse` repository.
3. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web` (or `./` using root `vercel.json`)
   - **Build Command**: `npm --workspace=apps/web run build`
4. Add **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: *(Your deployed backend URL, e.g. `https://tracefuse-api.onrender.com`)*
5. Click **Deploy**.

---

## 5. End-to-End Live Verification Checklist

Once deployed, test the following flow on your public Vercel URL:

- [ ] **Gated Auth**: Accessing `/` or `/dashboard` while unauthenticated immediately redirects to `/login`.
- [ ] **1-Click Judge Access**: Click **"⚡ Load Demo Investigation"** on `/login` $\rightarrow$ authenticates and navigates to the Flagship graph in $<60$ seconds.
- [ ] **Network Graph**: React Flow canvas loads 8+ accounts, devices, and animated transaction edges.
- [ ] **Follow the Money**: Click **Follow the Money** $\rightarrow$ hit **Play Animation** to step through the multi-hop sequence with highlighted glowing edges.
- [ ] **AI Assistant**: Open the **Ask AI Copilot** drawer $\rightarrow$ ask *"Why is this case suspicious?"* $\rightarrow$ confirm grounded response citing real case transaction IDs.
- [ ] **Case Workflow**: Change status to **Escalated** and add an investigator note $\rightarrow$ refresh page to confirm database persistence.
- [ ] **Compliance Report**: Click **Compliance Report** $\rightarrow$ verify all 9 regulatory sections render and browser **Print to PDF** formats cleanly.
