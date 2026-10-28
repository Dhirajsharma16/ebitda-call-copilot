from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    ProspectDiscoveryRequest,
    ProspectDiscoveryResponse,
    AddProspectTargetRequest,
    AddProspectTargetResponse,
    CompanyCreate,
    CompanyUpdate,
)
from app.services.discovery_service import discover_companies
from app.database import db

router = APIRouter(prefix="/api/discovery", tags=["AI Prospect Discovery"])

AVAILABLE_INDUSTRIES = [
    "Textile",
    "Spinning",
    "Automobile",
    "Auto Components",
    "Packaging",
    "FMCG",
    "Chemicals",
    "Other Manufacturing"
]

GEOGRAPHY_PRESETS = [
    "India (All Regions)",
    "Tamil Nadu (Coimbatore / Tirupur / Chennai)",
    "Gujarat (Ahmedabad / Surat / Vadodara)",
    "Maharashtra (Pune / Chakan / Aurangabad / Mumbai)",
    "Haryana (Gurugram / Faridabad / Panipat)",
    "Punjab (Ludhiana / Jalandhar)",
    "Karnataka (Bengaluru / Belagavi)",
    "Rajasthan (Bhilwara / Jaipur)"
]

@router.get("/options")
def get_discovery_options():
    """Returns available filters, industries, and geography presets."""
    return {
        "industries": AVAILABLE_INDUSTRIES,
        "geography_presets": GEOGRAPHY_PRESETS,
        "company_sizes": ["Any", "Small (< ₹100Cr)", "Medium (₹100Cr - ₹500Cr)", "Large (> ₹500Cr)"],
        "counts": [10, 25, 50],
        "limit_options": [10, 25, 50]
    }

@router.post("/search", response_model=ProspectDiscoveryResponse)
def search_prospects(payload: ProspectDiscoveryRequest):
    """
    Discovers, researches, and qualifies actual manufacturing companies matching target criteria.
    Uses grounded web search and verified public corporate directory intelligence.
    """
    if not payload.industry or not payload.industry.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Industry filter is required for targeted prospect discovery."
        )

    # Run discovery engine
    response = discover_companies(payload)

    # Cross-reference with existing Target Accounts in database to flag already saved accounts
    for prospect in response.prospects:
        existing = db.find_company_by_name_or_website(prospect.company_name, prospect.website)
        if existing:
            prospect.is_saved_in_accounts = True
            prospect.existing_account_id = existing.id

    return response

@router.post("/add-target", response_model=AddProspectTargetResponse)
def add_prospect_to_targets(payload: AddProspectTargetRequest):
    """
    Saves a discovered prospect to the existing Target Accounts directory (Supabase/DB).
    Enforces normalized duplicate detection and supports intelligence updating.
    """
    p = payload.prospect
    existing = db.find_company_by_name_or_website(p.company_name, p.website)

    if existing and not payload.force_update:
        return AddProspectTargetResponse(
            success=True,
            already_exists=True,
            message=f"'{existing.company_name}' is already in your Target Accounts. You can view its dossier or update its research.",
            company_id=existing.id,
            company=existing
        )

    if existing and payload.force_update:
        # Update existing company with fresh research intelligence
        updated = db.update_company(existing.id, CompanyUpdate(
            industry=p.industry,
            location=p.location,
            business_challenges=p.potential_discovery_angle or p.research_summary or existing.business_challenges,
            company_size=p.company_size,
            products_services=p.products_services or existing.products_services,
            expansion_news=p.expansion_news or existing.expansion_news,
            source_urls=p.source_urls or existing.source_urls,
            fit_score=p.prospect_fit_score,
            evidence_confidence=p.evidence_confidence,
            discovery_angle=p.potential_discovery_angle,
            research_summary=p.research_summary,
            revenue=p.revenue if (p.revenue and p.revenue > 0) else existing.revenue,
            operating_expenses=p.operating_expenses if (p.operating_expenses and p.operating_expenses > 0) else existing.operating_expenses,
        ))

        return AddProspectTargetResponse(
            success=True,
            already_exists=True,
            message=f"Target Account intelligence for '{updated.company_name}' updated successfully.",
            company_id=updated.id,
            company=updated
        )

    # Create new company record
    challenges_text = p.potential_discovery_angle or p.research_summary or "Discovered via AI Prospect Discovery."
    if p.expansion_news:
        challenges_text += f"\n\n• Capex & Expansion: {p.expansion_news}"

    new_comp = db.create_company(CompanyCreate(
        company_name=p.company_name,
        website=p.website,
        industry=p.industry,
        location=p.location,
        contact_name=p.contact_name or "Managing Director / CEO",
        contact_designation=p.contact_designation or "Managing Director",
        business_challenges=challenges_text,
        revenue=p.revenue or 0.0,
        operating_expenses=p.operating_expenses or 0.0,
        company_size=p.company_size,
        products_services=p.products_services,
        expansion_news=p.expansion_news,
        source_urls=p.source_urls or [],
        fit_score=p.prospect_fit_score,
        evidence_confidence=p.evidence_confidence,
        discovery_angle=p.potential_discovery_angle,
        research_summary=p.research_summary,
    ))

    return AddProspectTargetResponse(
        success=True,
        already_exists=False,
        message=f"'{new_comp.company_name}' successfully added to Target Accounts.",
        company_id=new_comp.id,
        company=new_comp
    )
