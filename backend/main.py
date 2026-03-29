import os
from dotenv import load_dotenv

load_dotenv()   # load .env before anything else

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers.xray_router import router as xray_router
from routers.tax_router  import router as tax_router
from routers.fire_router import router as fire_router

# ── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Money Mentor",
    description="AI-powered financial mentor for Indian retail investors.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────
# Allow all origins for development; restrict to your Vercel URL in production
# by setting ALLOWED_ORIGINS env var: "https://your-app.vercel.app"
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in raw_origins.split(",")] if raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,    # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────

app.include_router(xray_router)
app.include_router(tax_router)
app.include_router(fire_router)

# ── Health check ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "project": "AI Money Mentor"}

# ── Global exception handler ───────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Something went wrong. Please try again."},
    )

# ── Dev runner ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
