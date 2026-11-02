# 🚀 CampusSync — Production Deployment Guide

This guide provides step-by-step instructions for deploying CampusSync for the final project submission and live demonstration on **November 4, 2026**.

---

## 🏗️ Architecture Overview

| Component | Technology | Recommended Host | Free Tier |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Tailwind CSS | **Vercel** | Yes |
| **Backend** | FastAPI + SQLAlchemy + ChromaDB | **Render** / **Railway** | Yes |
| **Database** | PostgreSQL / SQLite fallback | **Render Postgres** or **Neon / Supabase** | Yes |
| **Auth** | Firebase Auth + Local Fail-Safe | Firebase / Self-contained | Yes |

---

## Part 1: Deploy Backend on Render (10 Minutes)

### Step 1: Push Repository to GitHub
Ensure all latest code is committed and pushed to `https://github.com/AshwaniSharma06/CampusSync.git` on branch `main`.

### Step 2: Create a Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub account and select repository `AshwaniSharma06/CampusSync`.
3. Fill in the deployment settings:
   - **Name:** `campussync-backend`
   - **Region:** Singapore / Frankfurt / Oregon (any)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank — repository root)*
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command:**
     ```bash
     python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Free`

### Step 3: Add Environment Variables in Render
In the **Environment Variables** tab, add:
| Key | Value | Notes |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures clean package resolution |
| `SECRET_KEY` | *(Click "Generate")* | Random JWT secret key |
| `DATABASE_URL` | `sqlite:///./campussync.db` | *(Or your PostgreSQL connection string)* |
| `GEMINI_API_KEY` | *(Your Gemini API key)* | Optional; RAG uses built-in ECA fallback if blank |

### Step 4: Deploy & Verify
Click **Create Web Service**. Once deployed:
- Test the health endpoint: `https://<your-render-app>.onrender.com/health` → should return `{"status": "ok"}`
- Test the interactive API docs: `https://<your-render-app>.onrender.com/docs`
- Copy your Render backend URL (e.g. `https://campussync-backend.onrender.com`).

---

## Part 2: Deploy Frontend on Vercel (5 Minutes)

### Step 1: Import Project to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Import repository `AshwaniSharma06/CampusSync`.

### Step 2: Configure Project Settings
- **Framework Preset:** `Vite` *(auto-detected)*
- **Root Directory:** `./` *(default)*
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Step 3: Set Environment Variables on Vercel
Under **Environment Variables**, add:
| Variable Name | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://<your-backend-app>.onrender.com/api/v1` *(replace with your backend URL)* |

> **Note on SPA Routing:** A [`vercel.json`](file:///c:/Users/sharm/CampusSync-Frontend/vercel.json) rewrite file is already included in the repository root, so refreshing on `/dashboard` or deep links will work smoothly without 404 errors.

### Step 4: Deploy
Click **Deploy**. Within 60 seconds, your live production website will be accessible at:
`https://<your-project>.vercel.app`

---

## Part 3: Deploy via Railway (Alternative)

If you prefer Railway:
1. Go to [Railway.app](https://railway.app/) → **New Project** → **Deploy from GitHub repo**.
2. Select `CampusSync`.
3. Railway automatically detects `Procfile` and `requirements.txt`.
4. Add environment variables `SECRET_KEY` and `DATABASE_URL`.
5. Under Settings → Networking → Generate Domain.

---

## Part 4: Fail-Safe & Viva Demo Strategy

1. **Zero-Configuration Mode:** If the backend is ever sleeping on Render's free tier during your viva presentation, CampusSync's frontend automatically uses its built-in local ECA mock engine, allowing full access to:
   - 1-Click Student Login (`Ashwani Sharma • 22ECA8941`)
   - Personalized Student Dashboard
   - ECA Copilot AI Assistant with verified BTU 2026 data
   - Notices, Timetables, and Events
2. **Local Fallback:** Always have `npm run dev` and `python -m uvicorn backend.main:app` running in your local terminal as an immediate offline backup if the auditorium Wi-Fi fluctuates.
