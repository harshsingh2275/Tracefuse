# TraceFuse — Financial Crime Investigation Cockpit

> **Build Bank Hackathon** — Youth Economy Lab (YEL), IGDTUW Chapter  
> **Track 2:** Fraud Detection & Financial Crime Prevention  
> **Problem Statement 5:** "Tracing Financial Crime Across Patterns"

---

## 🎯 Overview

**TraceFuse** is a financial crime investigation cockpit that models an entire financial ecosystem — accounts, persons, devices, merchants, beneficiaries, and transactions — as a live explorable graph. 

Instead of single-transaction binary classification, TraceFuse detects complex multi-hop structures over time:
- **Fan-Out & Fan-In Networks** (Burst fund distributions)
- **Layered Pass-Through Chains** (Rapid hopping through intermediaries)
- **Circular Fund Movement** (Cycles returning to originator)
- **Shared-Device Mule Rings** (Accounts linked via common device fingerprints)
- **Transaction Splitting / Fragmentation** (Structuring transfers to avoid alert thresholds)
- **Velocity Outliers & Burst Spikes**

Every suspicious finding is **deterministic, explainable, and traceable** back to specific transaction IDs and timestamps, paired with a grounded AI assistant copilot.

---

## 🏗️ Monorepo Architecture

```
/apps
  /web            → Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
  /api            → FastAPI backend (modular monolith API & routers)
/analytics
  /graph          → NetworkX graph construction & algorithms (BFS/DFS, cycles, centrality)
  /patterns       → 8 modular, rule-based pattern detectors & configuration
  /risk           → Explainable composite risk scoring engine
  /temporal       → Rolling window analysis & velocity/burst detection
/packages
  /shared         → Shared TypeScript interfaces & types mirroring API models
/data
  /seed           → Deterministic synthetic dataset generator (9 scenarios)
/docs             → Architecture & development notes
/tests            → Pytest unit & integration test suites
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **Python**: 3.11 or 3.12
- **PostgreSQL** (or local SQLite fallback)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `DATABASE_URL`: PostgreSQL connection string (or SQLite connection string `sqlite:///./tracefuse.db`)
- `AI_API_KEY`: Groq API key for AI Copilot (optional; deterministic fallback included)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)

### 3. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 4. Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```
Web Cockpit will be available at: `http://localhost:3000`

### 5. Running Tests
```bash
pytest
```

---

## 🔒 Demo Authentication & Hackathon Evaluation
- **Access Route**: `/login`
- **Judge 1-Click Access**: Click **"⚡ Load Demo Investigation"** (direct bypass into Flagship Case graph in $<60$s)
- **Demo Passcode**: `demo2026`

---

## 🧪 Comprehensive Test Suite
All 54 unit, integration, and acceptance tests pass:
```bash
pytest
```
Covers:
- All 8 rule-based pattern detectors (Section 5B & 11)
- Risk scoring engine with 60-point single-signal cap (Section 14)
- Multi-hop Follow-the-Money FIFO provenance trace (Section 5D & 12)
- All 9 seed data scenarios (Section 26)
- Full acceptance criteria audit (Section 27)
- All 13 FastAPI endpoints (Section 18)

---

## 🌐 Production Cloud Deployment
Complete step-by-step instructions available in [`docs/deployment-guide.md`](file:///d:/Tracefuse/docs/deployment-guide.md):
- **Frontend**: Deploy to **Vercel** with `vercel.json` and `NEXT_PUBLIC_API_URL`
- **Backend**: Deploy to **Render / Railway** with `render.yaml` / `Dockerfile` / `Procfile`
- **Database**: Deploy to **Supabase / Neon** and seed with `python -m data.seed.generate_seed_data`
