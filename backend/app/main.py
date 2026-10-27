from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.schemas import HealthResponse
from app.routers import companies, calculator, ai_assistant, calls, seed

app = FastAPI(
    title="AI EBITDA Cold Call Copilot API",
    description="Backend API powering financial EBITDA modeling, AI call preparation with Google Gemini (gemini-3.8-flash) & Groq.",
    version="1.0.0",
)

# CORS Configuration
origins = settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(companies.router)
app.include_router(calculator.router)
app.include_router(ai_assistant.router)
app.include_router(calls.router)
app.include_router(seed.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "name": "AI EBITDA Cold Call Copilot API",
        "version": "1.0.0",
        "status": "operational",
        "ai_engine": f"Google Gemini ({settings.GEMINI_MODEL})",
        "docs_url": "/docs",
        "health_url": "/health",
    }

@app.get("/health", tags=["Health"])
def health_check():
    """System health check verifying Gemini/Groq configuration and database connectivity."""
    db_status = db.get_status()
    gemini_ok = bool(settings.GEMINI_API_KEY.strip())
    groq_ok = bool(settings.GROQ_API_KEY.strip())

    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
        "gemini_configured": gemini_ok,
        "gemini_model": settings.GEMINI_MODEL,
        "groq_configured": groq_ok,
        "groq_model": settings.GROQ_MODEL,
        "database_mode": db_status.get("mode", "unknown"),
        "database_connected": db_status.get("connected", False)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
