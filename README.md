# AI EBITDA Cold Call Copilot

> An AI-powered Cold Call Copilot designed for business development professionals to prepare for, execute, and record high-stakes sales conversations with CEOs, Managing Directors, and senior executives. Framed around **EBITDA sensitivity, operating efficiency, and AI-driven diagnosis**.

---

## Architecture Overview

```
ebitda-copilot/
├── frontend/                 # Next.js 16 (TypeScript, Tailwind CSS v4, Lucide Icons)
│   ├── src/
│   │   ├── app/              # App Router (Dashboard, Companies, Calculator, Workspace, Calls)
│   │   ├── components/       # UI Components (Navbar, CompanyModal, etc.)
│   │   └── lib/              # API Client, Supabase Client & TypeScript Interfaces
│   ├── vercel.json           # Vercel Deployment Configuration
│   └── .env.example          # Frontend Environment Variables Template
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py           # FastAPI Application & Middleware
│   │   ├── config.py         # Pydantic Settings & Environment Parsing
│   │   ├── schemas.py        # Pydantic Request & Response Models
│   │   ├── database.py       # Supabase Integration + High-Fidelity Local Fallback
│   │   ├── routers/          # Modular API Endpoints (Companies, Calculator, AI, Calls, Seed)
│   │   └── services/         # Groq LLM Integration & EBITDA Scenario Modeler
│   ├── main.py               # Render/Uvicorn Root Entrypoint
│   ├── requirements.txt      # Python Dependencies
│   ├── render.yaml           # Render 1-Click Blueprint Specification
│   └── .env.example          # Backend Environment Variables Template
└── supabase/
    ├── schema.sql            # PostgreSQL DDL, Indexes, Triggers & RLS Policies
    └── seed.sql              # Realistic B2B Demo Accounts & Historical Call Records
```

---

## 1. Required Technology Stack

| Component | Technology | Target Hosting | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS v4 | **Vercel** | Responsive dark obsidian theme, blue & purple accents |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 | **Render** | Fast asynchronous endpoints with CORS |
| **Database** | PostgreSQL 15+ | **Supabase** | RLS enabled, indexed on foreign keys & dates |
| **Primary AI** | Google Gemini (`gemini-3.8-flash`) | Google GenAI API | Powered by `client.interactions.create` with fast failover |
| **Secondary AI** | Groq Cloud API | Groq Free Tier | `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` |

---

## 2. Core Functional Modules

### 1. Executive Dashboard (`/`)
- **Pipeline KPI Cards:** Total saved accounts, logged calls, pending & overdue follow-ups, and average portfolio EBITDA margin.
- **Overdue Alert Banner:** Real-time alert highlighting prospects needing immediate re-engagement.
- **Target Accounts Table:** Searchable by keyword, industry, or contact person with live EBITDA margin indicators.
- **Recent Call Feed:** Real-time log with outcome badges (`Interested`, `Follow-up Required`, `Not Interested`, `No Answer`).
- **Quick Actions:** Instant "Add Company" modal and "Start Call Session" launcher.

### 2. Company Research & Intelligence (`/companies` & `/companies/[id]`)
- **Verified Facts Only:** Clear banner declaring profile information is strictly user-provided. No hallucinated figures.
- **Factual Attributes:** Company name, website, industry sector, location, target executive name & designation, known operational bottlenecks.
- **Live EBITDA Preview:** Automatically calculates EBITDA and margin as revenue and operating expense numbers are entered.

### 3. Interactive EBITDA Calculator & What-If Modeler (`/calculator`)
- **Standard Formula:**
  $$\text{EBITDA} = \text{Revenue} - \text{Operating Expenses (excl. D\&A, Interest, Taxes)}$$
  $$\text{EBITDA Margin (\%)} = \left(\frac{\text{EBITDA}}{\text{Revenue}}\right) \times 100$$
- **Reconciliation Module:** Optional toggle for Depreciation, Amortization, Interest, and Taxes.
- **Hypothetical Scenario Modeler:**
  - Interactive sliders for **Operating Cost Reduction ($\%$)** and **Revenue Sensitivity ($\%$)**.
  - Comparison deltas ($\Delta$ EBITDA dollars and $\Delta$ Margin bps).
  - Prominent disclaimer: *Hypothetical scenario for sales discussion purposes only. Does not guarantee specific business outcomes or savings.*

### 4. Live Call Workspace (`/workspace`)
- **Single-Screen Command Center:** Keeps all prospect context in front of the salesperson during a cold call.
- **Real-Time Call Timer:** Tracks exact minutes and seconds elapsed during the call.
- **AI Cold Call Assistant (Groq LLM):**
  1. *Opening Line:* Peer-to-peer executive conversation starter.
  2. *Discovery Questions:* 4 targeted operational bottleneck prompts.
  3. *Financial Framing Questions:* EBITDA sensitivity inquiries.
  4. *Objections & Rebuttals:* Interactive cards for handling gatekeepers and budget objections.
  5. *AI Problem-Solving Pitch:* Concise explanation of how AI/analytics investigates their challenge.
  6. *Natural Closing Line:* Low-friction meeting request.
- **Live Interactive Features:**
  - Click **"+ Notes"** on any discovery question to automatically paste it into the call console.
  - Inline editing of AI suggestions.
  - One-click copy buttons for every section.
- **Active Call Console:** Notes scratchpad, outcome selector, follow-up date picker (with smart buttons: Tomorrow, +3 Days, Next Week), and one-click save.
- **Privacy Standard:** Strictly manual notes; no unauthorized audio recording.

### 5. Call History & Follow-up Pipeline (`/calls`)
- **All Call Records Tab:** Filter by outcome (`Interested`, `Follow-up Required`, `Not Interested`, `No Answer`), search by keyword.
- **Scheduled Follow-ups Tab:** Partitioned into Overdue (highlighted in red) and Upcoming.
- **In-Place Updates:** Modal to reschedule follow-up dates, edit notes, or update deal outcomes.

---

## 3. Database Setup (Supabase)

1. Create a free project at [database.new](https://database.new) (Supabase).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this repository and run the script:
   - Creates `companies` and `call_records` tables with UUID keys and foreign constraints.
   - Creates indexes on `company_id`, `call_date`, `follow_up_date`, and `call_outcome`.
   - Enables Row Level Security (RLS) with policies for public/anon access.
4. Open `supabase/seed.sql` and run it to populate realistic sample data.
5. In **Project Settings -> API**, copy your **Project URL** and **anon public key**.

---

## 4. Backend Setup & Render Deployment

### Local Development:
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GROQ_API_KEY and SUPABASE credentials (optional)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

### Deploying to Render:
1. Push this repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New + -> Web Service**.
3. Select your GitHub repository.
4. Configure the settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: Your key from [console.groq.com](https://console.groq.com)
   - `GROQ_MODEL`: `llama-3.3-70b-versatile`
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase key
   - `FRONTEND_ORIGIN`: `*` (or your deployed Vercel domain)
6. Click **Deploy Web Service**. Note the deployed URL (e.g. `https://your-app.onrender.com`).

---

## 5. Frontend Setup & Vercel Deployment

### Local Development:
```powershell
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploying to Vercel:
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New -> Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://your-app.onrender.com` (your backend Render URL)
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your_supabase_anon_public_key`
6. Click **Deploy**.

---

## 6. Verification & Testing Checklist

- [x] **Dashboard:** Loads cleanly, displays KPI metrics, overdue follow-up alerts, and company cards.
- [x] **Company Creation:** Modal creates new company with validated inputs and live EBITDA calculation.
- [x] **Company Retrieval:** Directory lists accounts with search and industry filtering.
- [x] **EBITDA Calculator:** Accurately computes $\text{Revenue} - \text{OpEx}$ and margin percentage, safely handles zero revenue.
- [x] **What-If Scenario Modeler:** Sliders dynamically compute projected EBITDA, margin, and deltas with disclaimer.
- [x] **Groq AI Call Assistant:** Generates all 6 core sales sections using `llama-3.3-70b-versatile`.
- [x] **Resilient AI Fallback:** Gracefully switches to synthesis engine if `GROQ_API_KEY` is omitted, returning structured recommendations.
- [x] **Live Workspace:** Interactive split view with call timer, editable talking points, "+ Notes" question insertion, and outcome logger.
- [x] **Call History & Follow-ups:** Records saved calls, displays overdue follow-ups in red badge, and allows rescheduling.
- [x] **Security:** Supabase service-role key is kept strictly on the backend. Frontend only uses public anon keys.
- [x] **Zero Downtime Local Fallback:** Works in standalone mode via browser local store if backend is offline, and via in-memory store in FastAPI if Supabase credentials are not yet entered.

---

## 7. Sample Walkthrough Script for Sales Reps

1. **Review Dashboard:** Open [https://ebitda-call-copilot.vercel.app/](url) to inspect today's overdue follow-ups.
2. **Select Account:** Choose *Apex Industrial Logistics Corp* ($42.5M Revenue, 10.0% EBITDA Margin).
3. **Model Scenario:** Open `/calculator`, toggle Cost Reduction to 5%, observing a projected +$1.91M EBITDA expansion.
4. **Launch Call:** Click **"Start Call Session"** to open `/workspace?companyId=...`.
5. **Start Timer:** Click **"Start Call"** on the top header.
6. **Deliver Opening:** Read the customised opening line: *"Marcus, noticed Apex expanded fleet routes across the south corridor..."*
7. **Conduct Discovery:** Click **"+ Notes"** next to Question 1 to automatically populate the notes field with prospect prompts.
8. **Handle Pushback:** Click the **Objections** tab if the prospect mentions budget freezes to reference the rebuttal.
9. **Log Outcome:** Select **"Follow-up Required"**, set follow-up date for next Tuesday, and click **"Save Call Record"**.
10. **Track Progress:** Verify the saved call immediately appears in `/calls`.
