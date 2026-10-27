from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas import CompanyCreate, CompanyUpdate, CompanyOut, CallRecordOut
from app.database import db

router = APIRouter(prefix="/api/companies", tags=["Companies"])

@router.get("", response_model=List[CompanyOut])
def list_companies(search: Optional[str] = Query(None, description="Search by company name or industry")):
    """Retrieve all saved companies, optionally filtered by keyword."""
    return db.list_companies(search=search)

@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate):
    """Add a new company profile with validated financial and contact attributes."""
    if not payload.company_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Company name is required."
        )
    return db.create_company(payload)

@router.get("/{company_id}", response_model=Dict[str, Any])
def get_company_detail(company_id: str):
    """Retrieve a single company profile along with its historical call records."""
    company = db.get_company(company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with ID '{company_id}' not found."
        )
    calls = db.list_calls(company_id=company_id)
    return {
        "company": company,
        "calls": calls
    }

@router.put("/{company_id}", response_model=CompanyOut)
def update_company(company_id: str, payload: CompanyUpdate):
    """Update company details, financial figures, or contact information."""
    updated = db.update_company(company_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with ID '{company_id}' not found."
        )
    return updated

@router.delete("/{company_id}", status_code=status.HTTP_200_OK)
def delete_company(company_id: str):
    """Delete a company and associated call history."""
    deleted = db.delete_company(company_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with ID '{company_id}' not found."
        )
    return {"message": "Company deleted successfully.", "id": company_id}
