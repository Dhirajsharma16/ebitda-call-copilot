from fastapi import APIRouter, HTTPException, status
from app.schemas import EBITDACalculationRequest, EBITDACalculationResponse
from app.services.ebitda_service import calculate_ebitda_and_scenario

router = APIRouter(prefix="/api/calculator", tags=["EBITDA Calculator"])

@router.post("/ebitda", response_model=EBITDACalculationResponse)
def calculate_ebitda(payload: EBITDACalculationRequest):
    """
    Computes EBITDA, EBITDA Margin, and optional What-If scenario projections.
    Handles zero revenue and missing reconciliations safely.
    """
    try:
        return calculate_ebitda_and_scenario(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Financial calculation error: {str(e)}"
        )
