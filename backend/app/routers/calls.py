from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas import CallRecordCreate, CallRecordUpdate, CallRecordOut, CallOutcome
from app.database import db

router = APIRouter(tags=["Call Records & Follow-ups"])

@router.get("/api/calls", response_model=List[CallRecordOut])
def list_calls(
    company_id: Optional[str] = Query(None, description="Filter by company UUID"),
    outcome: Optional[CallOutcome] = Query(None, description="Filter by call outcome"),
    overdue_only: bool = Query(False, description="Filter to only overdue follow-ups")
):
    """Retrieve call records with flexible filters."""
    outcome_str = outcome.value if outcome else None
    return db.list_calls(company_id=company_id, outcome=outcome_str, overdue_only=overdue_only)

@router.post("/api/calls", response_model=CallRecordOut, status_code=status.HTTP_201_CREATED)
def create_call_record(payload: CallRecordCreate):
    """Save a call session with outcome, notes, follow-up date, and AI preparation."""
    # Verify company exists
    comp = db.get_company(payload.company_id)
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot record call: Company ID '{payload.company_id}' not found."
        )
    return db.create_call(payload)

@router.get("/api/calls/{call_id}", response_model=CallRecordOut)
def get_call_record(call_id: str):
    """Retrieve an individual call record by ID."""
    call = db.get_call(call_id)
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call record with ID '{call_id}' not found."
        )
    return call

@router.patch("/api/calls/{call_id}", response_model=CallRecordOut)
def update_call_record(call_id: str, payload: CallRecordUpdate):
    """Update call outcome, follow-up date, notes, or AI prep."""
    updated = db.update_call(call_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call record with ID '{call_id}' not found."
        )
    return updated

@router.delete("/api/calls/{call_id}", status_code=status.HTTP_200_OK)
def delete_call_record(call_id: str):
    """Delete a call record."""
    deleted = db.delete_call(call_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call record with ID '{call_id}' not found."
        )
    return {"message": "Call record deleted successfully.", "id": call_id}

@router.get("/api/follow-ups", response_model=Dict[str, Any])
def get_follow_ups():
    """Retrieve grouped overdue and upcoming pending follow-ups."""
    return db.get_follow_ups()
