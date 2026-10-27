from fastapi import APIRouter, HTTPException, status
from app.schemas import AICallPrepRequest, AICallPrepResponse
from app.services.groq_service import generate_call_prep
from app.database import db

router = APIRouter(prefix="/api/ai", tags=["AI Call Assistant"])

@router.post("/prepare-call", response_model=AICallPrepResponse)
async def prepare_call(payload: AICallPrepRequest):
    """
    Generates cold call preparation strategy:
    1. Short natural opening line
    2. 3-5 Discovery questions
    3. Industry & profitability specific questions
    4. Objections & executive rebuttals
    5. AI problem-solving angle
    6. Natural closing line
    """
    # If company_id is provided but some fields are omitted, auto-populate from saved record
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

    return await generate_call_prep(payload)
