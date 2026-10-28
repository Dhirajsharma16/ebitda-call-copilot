from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.schemas import AICallPrepRequest, AICallPrepResponse
from app.services.gemini_service import (
    generate_gemini_call_prep,
    generate_gemini_follow_up_email,
    research_company_with_gemini
)
from app.services.groq_service import generate_call_prep as generate_groq_call_prep
from app.config import settings
from app.database import db

router = APIRouter(prefix="/api/ai", tags=["AI Call Assistant"])

class EmailGenerationRequest(BaseModel):
    company_name: str
    contact_name: Optional[str] = None
    contact_designation: Optional[str] = None
    notes: Optional[str] = None
    ebitda: Optional[float] = None
    ebitda_margin_pct: Optional[float] = None
    follow_up_date: Optional[str] = None

class CompanyResearchRequest(BaseModel):
    company_name: str
    industry: Optional[str] = None

@router.post("/prepare-call", response_model=AICallPrepResponse)
async def prepare_call(payload: AICallPrepRequest):
    """
    Generates cold call preparation strategy using Google Gemini (gemini-3.8-flash)
    with seamless fallback to Groq or synthesis engine.
    """
    if payload.company_id and (not payload.business_challenges or payload.revenue is None):
        saved = db.get_company(payload.company_id)
        if saved:
            if not payload.company_name:
                payload.company_name = saved.company_name
            if not payload.industry:
                payload.industry = saved.industry
            if not payload.location:
                payload.location = saved.location
            if not payload.contact_name:
                payload.contact_name = saved.contact_name
            if not payload.contact_designation:
                payload.contact_designation = saved.contact_designation
            if not payload.business_challenges:
                payload.business_challenges = saved.business_challenges
            if payload.revenue is None or payload.revenue == 0:
                payload.revenue = saved.revenue
            if payload.operating_expenses is None or payload.operating_expenses == 0:
                payload.operating_expenses = saved.operating_expenses
            if payload.ebitda is None:
                payload.ebitda = saved.ebitda
            if payload.ebitda_margin_pct is None:
                payload.ebitda_margin_pct = saved.ebitda_margin_pct

    if not payload.company_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Company name is required for AI call preparation."
        )

    # Use Gemini 3.8 Flash as primary
    if settings.GEMINI_API_KEY.strip():
        gemini_res = await generate_gemini_call_prep(payload)
        # If Gemini returned simulation/fallback and Groq is configured, try Groq
        if gemini_res.is_simulated and settings.GROQ_API_KEY.strip():
            groq_res = await generate_groq_call_prep(payload)
            if not groq_res.is_simulated:
                return groq_res
        return gemini_res
    
    # Fallback to Groq
    return await generate_groq_call_prep(payload)

@router.post("/follow-up-email")
async def generate_email(payload: EmailGenerationRequest):
    """Generates an executive-level post-call follow-up email for a CEO/MD."""
    return await generate_gemini_follow_up_email(
        company_name=payload.company_name,
        contact_name=payload.contact_name,
        contact_designation=payload.contact_designation,
        notes=payload.notes,
        ebitda=payload.ebitda,
        margin_pct=payload.ebitda_margin_pct,
        follow_up_date=payload.follow_up_date
    )

@router.post("/research-company")
async def research_company(payload: CompanyResearchRequest):
    """Auto-generates typical operational bottlenecks and EBITDA benchmark hooks."""
    return await research_company_with_gemini(
        company_name=payload.company_name,
        industry=payload.industry
    )
