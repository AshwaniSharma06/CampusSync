# 🎓 CampusSync — Intelligent Campus Management Platform

[![Frontend Build](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Styling](https://img.shields.io/badge/CSS-Tailwind%20v3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Vector Database](https://img.shields.io/badge/VectorDB-ChromaDB-FF6F00)](https://www.trychroma.com/)
[![LLM](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**CampusSync** is an intelligent, unified campus command center engineered for university students. Featuring an editorial **"Cinematic Academic"** visual design, CampusSync brings together official university notices, department circulars, upcoming assignment deadlines, student club communities, and a context-grounded **Gemini RAG Copilot**.

---

## 🌟 Key Features

* 🏛️ **Student Command Center**: Real-time overview of semester progress, cumulative attendance, pending assignments, and enrolled courses.
* 🤖 **CampusSync AI Copilot (RAG)**: Grounded question answering powered by ChromaDB vector search and Google Gemini Flash with verified citations.
* 🎯 **Rule-Based Personalization**: Dynamic "Curated for You" engine recommending department-specific circulars, workshops, and hackathons based on branch, semester, and interests.
* 📢 **Verified Notice Ingestion**: Web scrapers (BeautifulSoup & Playwright) and PDF text extraction pipelines collecting real BTU & college updates.
* 💬 **Interactive Student Feed**: Sanitized peer discussions, technical questions, and club events with XSS protection and like reactions.
* 🌐 **Three.js WebGL Community Sphere**: Interactive 3D visualization connecting campus departments, clubs, and research cells.
* 🛡️ **Full-Stack Resilience**: Firebase Authentication, PostgreSQL relational storage, JWT verification, and React ErrorBoundary protection.

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    A[React 18 + Vite] -->|REST / JWT| B[FastAPI Gateway]
    B --> C[(PostgreSQL 15)]
    B --> D[(ChromaDB Embeddings)]
    B --> E[Google Gemini Flash API]
    F[Scraper / PDF Engine] --> D
```

For detailed architecture diagrams, ER schemas, and endpoint references, see [ARCHITECTURE.md](ARCHITECTURE.md) and [DEVELOPMENT_CHECKLIST.md](DEVELOPMENT_CHECKLIST.md).

---

## ⚙️ Quickstart Guide

### Prerequisites
- **Node.js** (v18.0 or higher) and `npm`
- **Python** (v3.10 or higher) and `pip`
- **PostgreSQL** (v14+ recommended) or SQLite for local dev

### 1. Frontend Setup

```bash
# Clone the repository
git clone https://github.com/AshwaniSharma06/CampusSync.git
cd CampusSync

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The React frontend will be accessible at `http://localhost:5173`.

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI application
uvicorn main:app --reload --port 8000
```
Interactive Swagger documentation will be available at `http://localhost:8000/docs`.

### 3. Environment Configuration

Create a `.env` file in the root and in `backend/` using the provided templates:

```env
# Frontend .env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_ENV=development
```

```env
# Backend .env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campussync
SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🧪 Testing

Run backend tests using `pytest`:

```bash
pytest backend/tests/
```

Verify frontend production build:

```bash
npm run build
```

---

## 📄 Academic Project Context

* **Project**: Final Year B.Tech Computer Science Engineering Capstone
* **Scope**: Semester 7 (Student Portal, Personalization, RAG Assistant)
* **University Affiliation**: Bikaner Technical University (BTU) / Engineering College Ajmer (ECA)
