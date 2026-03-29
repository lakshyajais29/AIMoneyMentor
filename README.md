# 💰 AI Money Mentor

> Personal AI-powered financial mentor for Indian retail investors.

---

## What It Does

| Feature | What You Get |
|---|---|
| **MF Portfolio X-Ray** | Upload CAMS PDF → True XIRR, portfolio overlap, expense ratio drag, AI rebalancing plan |
| **FIRE Path Planner** | Enter income/expenses/goals → FIRE date, monthly SIP required, year-by-year corpus chart |
| **Tax Wizard** | Upload Form 16 or enter manually → Old vs New regime comparison, missed deductions, AI tax tips |
| **Money Health Score** | Answer 6 sliders → Score out of 100 across 6 dimensions with personalised tips |

---

## Tech Stack

| Layer | Tool |
|---|---|
| Backend | FastAPI (Python 3.11) |
| PDF Parsing | PyMuPDF (fitz) |
| XIRR | pyxirr |
| LLM | Google Gemini 1.5 Flash (free tier) |
| Frontend | Next.js 14 + Tailwind CSS + Recharts |
| Backend Hosting | Render (free tier) |
| Frontend Hosting | Vercel (free tier) |

---

## Project Structure

```
ai-money-mentor/
├── backend/
│   ├── main.py                  # FastAPI app + CORS + routers
│   ├── requirements.txt
│   ├── render.yaml              # Render deployment config
│   ├── llm/gemini.py            # Gemini 1.5 Flash client
│   ├── parsers/
│   │   ├── cams_parser.py       # CAMS/KFintech PDF parser
│   │   └── form16_parser.py     # Form 16 PDF parser
│   ├── calculators/
│   │   ├── xirr.py              # XIRR calculation (pyxirr)
│   │   ├── overlap.py           # Portfolio overlap detection
│   │   ├── fire.py              # FIRE corpus + SIP engine
│   │   └── tax.py               # FY 2025-26 tax calculator
│   ├── agents/
│   │   ├── xray_agent.py        # X-Ray orchestration pipeline
│   │   ├── fire_agent.py        # FIRE planning pipeline
│   │   └── tax_agent.py         # Tax analysis pipeline
│   └── routers/
│       ├── xray_router.py       # POST /api/xray
│       ├── fire_router.py       # POST /api/fire
│       └── tax_router.py        # POST /api/tax
└── frontend/
    ├── app/
    │   ├── page.tsx             # Landing page
    │   ├── xray/page.tsx        # MF X-Ray page
    │   ├── fire/page.tsx        # FIRE Planner page
    │   ├── tax/page.tsx         # Tax Wizard page
    │   └── health/page.tsx      # Health Score page
    ├── components/
    │   ├── Navbar.tsx
    │   ├── FileUpload.tsx        # Drag & drop PDF uploader
    │   ├── ResultCard.tsx        # AI advice display card
    │   ├── XRayCharts.tsx        # Portfolio X-Ray results
    │   ├── FIREForm.tsx          # FIRE input form
    │   ├── FIREChart.tsx         # FIRE results + Recharts graph
    │   ├── TaxForm.tsx           # Tax input (upload + manual tabs)
    │   ├── TaxComparison.tsx     # Tax regime comparison
    │   ├── HealthScoreForm.tsx   # 6-slider health form
    │   └── HealthScoreResult.tsx # Score ring + dimension bars
    └── lib/formatters.ts         # INR / crore / % formatters
```

---

## Local Setup

### 1. Backend

```bash
cd backend

# Copy and fill in your Gemini API key
cp .env.example .env
# Edit .env: GEMINI_API_KEY=your_key_here

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run
python main.py
# → API running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend

# Copy env file
cp .env.example .env.local
# .env.local already has: NEXT_PUBLIC_API_URL=http://localhost:8000

# Install dependencies
npm install

# Run
npm run dev
# → App running at http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/xray` | Upload CAMS PDF → X-Ray analysis |
| `POST` | `/api/fire` | JSON body → FIRE projection |
| `POST` | `/api/tax` | Form 16 PDF or manual fields → Tax comparison |

### POST /api/fire — Example Request

```json
{
  "age": 30,
  "monthly_income": 150000,
  "monthly_expenses": 80000,
  "existing_investments": 500000,
  "goals": [
    { "name": "Child Education", "target_amount": 2000000, "years": 15 }
  ]
}
```

### POST /api/tax — Manual Entry (multipart form fields)

```
gross_salary=1800000
hra_received=240000
section_80c=150000
section_80d=25000
section_80ccd=50000
tds_deducted=280000
```

---

## Deployment

### Backend → Render

1. Push `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set root to `backend/`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `GEMINI_API_KEY = your_key`
7. After deploy, copy the Render URL (e.g. `https://ai-money-mentor.onrender.com`)

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Set root directory to `frontend/`
4. Add environment variable: `NEXT_PUBLIC_API_URL = https://ai-money-mentor.onrender.com`
5. Deploy

### After Both Are Deployed

Update `ALLOWED_ORIGINS` in your Render environment variables:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## Get Your Free Gemini API Key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google
3. Click "Create API Key"
4. Copy and paste into your `.env` file

Free tier: 15 requests/minute, 1 million tokens/day — more than enough.

---

## Financial Disclaimers

- This tool is for **educational purposes only**
- Not SEBI registered financial advice
- Tax calculations based on FY 2025-26 Finance Act — verify with a CA before filing
- Investment projections assume historical returns which are not guaranteed
- No user data or PDFs are stored anywhere

---
