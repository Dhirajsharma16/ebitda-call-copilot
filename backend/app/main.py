import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.schemas import HealthResponse
from app.routers import companies, calculator, ai_assistant, calls, seed, discovery

app = FastAPI(
    title="AI EBITDA Cold Call Copilot API",
    description="Backend API powering financial EBITDA modeling, AI call preparation with Google Gemini (gemini-3.8-flash) & Groq, and AI Prospect Discovery.",
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
app.include_router(discovery.router)

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

from pydantic import BaseModel

class KeyUpdate(BaseModel):
    api_key: str

@app.post("/api/settings/gemini-key", tags=["Settings"])
def update_gemini_key(payload: KeyUpdate):
    key = payload.api_key.strip()
    settings.GEMINI_API_KEY = key
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        found = False
        new_lines = []
        for line in lines:
            if line.startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={key}\n")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"GEMINI_API_KEY={key}\n")
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        pass
    return {"success": True, "gemini_configured": bool(key), "message": "Gemini API key updated successfully!"}

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
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
