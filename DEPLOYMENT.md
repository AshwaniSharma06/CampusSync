# 🚀 CampusSync — Complete Production Deployment Guide

This guide provides tested, step-by-step instructions to deploy CampusSync with full database persistence, ChromaDB vector search, background scraping scheduler, and zero "Backend Offline" errors.

---

## 🔍 Why You Saw "Backend Offline" & "Unable to synchronize" Previously

1. **Missing `VITE_API_URL` on Vercel:**  
   If you deploy the frontend to Vercel without setting `VITE_API_URL`, the deployed website falls back to `http://localhost:8000`. Because visitors' browsers cannot connect to `localhost:8000`, every API request fails, triggering the amber banner in the dashboard and the *"Backend Offline"* message in AI chat.
2. **Hardcoded `localhost:8000` in AuthContext:**  
   `src/context/AuthContext.jsx` previously had `http://localhost:8000` hardcoded. **(Fixed in Phase 9.3A).**
3. **Render Free Tier Sleeping:**  
   Free web services on Render shut down after 15 minutes of inactivity and have **ephemeral disks** (wiping SQLite updates). During cold-starts (50s delay), the frontend displays the offline warning banner.

---

## 🏗️ Recommended Deployment Stack

| Component | Platform | Plan | Cost | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Hobby | Free ($0) | Instant global CDN, automatic SSL, SPA rewrite handling. |
| **Backend & Database** | **Railway** (or Render) | Hobby / Trial | ~$5/mo (Free with credits) | **Persistent Volume** support (`/data`), **never sleeps**, 24/7 background scheduler. |
| **CampusSync AI** | **Google Gemini** | Free Tier | Free ($0) | Fast RAG conversational answers via `gemini-flash-lite-latest`. |

---

## STEP 1: Push Code to GitHub

Open PowerShell in `c:\Users\sharm\CampusSync-Frontend` and push your latest code to GitHub:

```powershell
git add .
git commit -m "CampusSync Phase 9 Production Readiness & Deployment Assets"
git push origin main
```

---

## STEP 2: Deploy Backend on Railway (Recommended — 5 Minutes)

Railway natively supports Dockerfiles, persistent volumes, and continuous 24/7 background tasks.

1. Go to [Railway.app](https://railway.app/) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo** → Select `CampusSync` (or your repo).
3. Once the service is created, click on it and go to **Settings**:
   - **Networking:** Click **Generate Domain** (e.g. `campussync-production.up.railway.app`).
4. Go to the **Volumes** tab:
   - Click **Add Volume**.
   - Set **Mount Path:** `/data`
   - Size: `5 GB` (persists SQLite database, ChromaDB vectors, and scraping logs).
5. Go to the **Variables** tab and add the following:

| Variable Name | Recommended Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Enforces production security checks |
| `SECRET_KEY` | *(Generate a 32+ character random string)* | Secure JWT token signing secret |
| `DATABASE_URL` | `sqlite:////data/campussync.db` | Persistent SQLite path on volume |
| `CHROMA_PERSIST_DIRECTORY` | `/data/chromadb` | Persistent ChromaDB vector index |
| `GEMINI_API_KEY` | *(Your Gemini API Key from Google AI Studio)* | Powers CampusSync AI Copilot |
| `FRONTEND_URL` | `https://<your-project>.vercel.app` | Whitelists frontend origin for CORS |
| `SCRAPER_ENABLED` | `true` | Automated 180-min scraping scheduler |

6. Railway will automatically build using your `Dockerfile` and run `./docker-entrypoint.sh`.
7. Once deployed, test your backend health in your browser:
   `https://<your-railway-url>.up.railway.app/health`
   You should see: `{"status": "ok", "message": "CampusSync FastAPI backend is operational.", "version": "1.0.0"}`

---

## STEP 3: Deploy Frontend on Vercel (3 Minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Select your `CampusSync` repository.
3. Configure Project Settings:
   - **Framework Preset:** `Vite` *(auto-detected)*
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **CRUCIAL STEP — Set Environment Variable:**
   Under **Environment Variables**, add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://<your-railway-url>.up.railway.app/api/v1` *(Replace with your actual Railway URL + `/api/v1`)*
5. Click **Deploy**.
6. Within 60 seconds, your site will be live at `https://<your-project>.vercel.app`!

---

## STEP 4: Alternative Backend Deployment on Render

If you prefer Render instead of Railway:

1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
2. Select your repository.
3. Settings:
   - **Runtime:** `Python 3` or `Docker`
   - **Instance Type:** `Free` (or `Starter` if adding a persistent disk)
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `SECRET_KEY`: *(Generate a 32+ char key)*
   - `DATABASE_URL`: `sqlite:///campussync.db`
   - `GEMINI_API_KEY`: *(Your Gemini API key)*
   - `FRONTEND_URL`: `https://<your-project>.vercel.app`
5. **Prevent Sleep Mode on Render Free:**
   Because Render Free spins down after 15 minutes of inactivity, set up a free monitor at [UptimeRobot](https://uptimerobot.com/) or [Cron-job.org](https://cron-job.org/) to ping `https://<your-render-url>.onrender.com/health` every 10 minutes. This prevents the server from sleeping!

---

## STEP 5: Verification & Demonstration Checklist

Once both Frontend and Backend are live:
1. Open your Vercel URL (`https://<your-project>.vercel.app`).
2. Log in with:
   - **Email:** `student@ecajmer.ac.in`
   - **Password:** `password123`
3. Notice:
   - **Zero Amber Warning Banner:** The dashboard immediately connects to the live backend and loads courses, verified notices, and upcoming exams.
   - **CampusSync AI:** Open the copilot in the dashboard or click the bottom-right AI bubble and ask:
     *"When are the 7th semester mid-term exams?"*
     CampusSync AI responds dynamically with official grounded citations.
