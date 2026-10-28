from datetime import datetime
from typing import Optional, List, Any, Dict
from enum import Enum
from pydantic import BaseModel, Field, field_validator

class CallOutcome(str, Enum):
    INTERESTED = "Interested"
    FOLLOW_UP_REQUIRED = "Follow-up Required"
    NOT_INTERESTED = "Not Interested"
    NO_ANSWER = "No Answer"

# ---------------------------------------------------------
# Company Schemas
# ---------------------------------------------------------
class CompanyBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255, description="Name of the company")
    website: Optional[str] = Field(None, max_length=255, description="Website URL")
    industry: Optional[str] = Field(None, max_length=120, description="Primary industry sector")
    location: Optional[str] = Field(None, max_length=255, description="HQ or office location")
    contact_name: Optional[str] = Field(None, max_length=255, description="Primary prospect name")
    contact_designation: Optional[str] = Field(None, max_length=255, description="Title/Role e.g. CEO, MD")
    business_challenges: Optional[str] = Field(None, description="Known operational or margin challenges")
    revenue: float = Field(default=0.0, ge=0.0, description="Annual or relevant period revenue")
    operating_expenses: float = Field(default=0.0, ge=0.0, description="Operating expenses excluding D&A, interest, tax")
    company_size: Optional[str] = Field(None, description="Small, Medium, Large")
    products_services: Optional[str] = Field(None, description="Core manufactured products and services")
    expansion_news: Optional[str] = Field(None, description="Recent public expansion, capex, or business developments")
    source_urls: Optional[List[str]] = Field(default_factory=list, description="Verified public sources")
    fit_score: Optional[int] = Field(None, description="Prospect suitability score 0-100")
    evidence_confidence: Optional[str] = Field(None, description="High, Medium, Low")
    discovery_angle: Optional[str] = Field(None, description="Hypothesized EBITDA exploration angle")
    research_summary: Optional[str] = Field(None, description="Executive research synopsis")

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    website: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    contact_name: Optional[str] = None
    contact_designation: Optional[str] = None
    business_challenges: Optional[str] = None
    revenue: Optional[float] = Field(None, ge=0.0)
    operating_expenses: Optional[float] = Field(None, ge=0.0)
    company_size: Optional[str] = None
    products_services: Optional[str] = None
    expansion_news: Optional[str] = None
    source_urls: Optional[List[str]] = None
    fit_score: Optional[int] = None
    evidence_confidence: Optional[str] = None
    discovery_angle: Optional[str] = None
    research_summary: Optional[str] = None

class CompanyOut(CompanyBase):
    id: str
    created_at: datetime
    updated_at: datetime
    ebitda: float = 0.0
    ebitda_margin_pct: float = 0.0

# ---------------------------------------------------------
# Call Record Schemas
# ---------------------------------------------------------
class CallRecordBase(BaseModel):
    company_id: str
    contact_name: Optional[str] = None
    call_date: Optional[datetime] = None
    notes: Optional[str] = None
    call_outcome: CallOutcome
    follow_up_date: Optional[datetime] = None
    ai_preparation: Optional[Dict[str, Any]] = None

class CallRecordCreate(CallRecordBase):
    pass

class CallRecordUpdate(BaseModel):
    contact_name: Optional[str] = None
    notes: Optional[str] = None
    call_outcome: Optional[CallOutcome] = None
    follow_up_date: Optional[datetime] = None
    ai_preparation: Optional[Dict[str, Any]] = None

class CallRecordOut(BaseModel):
    id: str
    company_id: str
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    call_date: datetime
    notes: Optional[str] = None
    call_outcome: CallOutcome
    follow_up_date: Optional[datetime] = None
    ai_preparation: Optional[Dict[str, Any]] = None
    created_at: datetime
    is_overdue: bool = False

# ---------------------------------------------------------
# EBITDA Calculator Schemas
# ---------------------------------------------------------
class EBITDACalculationRequest(BaseModel):
    revenue: float = Field(default=0.0, ge=0.0, description="Total revenue")
    operating_expenses: float = Field(
        default=0.0,
        ge=0.0,
        description="Operating expenses excluding D&A, interest, and taxes"
    )
    interest: Optional[float] = Field(default=0.0, ge=0.0, description="Optional interest expense for reconciliation")
    taxes: Optional[float] = Field(default=0.0, ge=0.0, description="Optional taxes for reconciliation")
    depreciation: Optional[float] = Field(default=0.0, ge=0.0, description="Optional depreciation")
    amortization: Optional[float] = Field(default=0.0, ge=0.0, description="Optional amortization")
    
    # Scenario inputs (percentages, e.g., 5.0 for +5%, -10.0 for -10%)
    hypothetical_revenue_change_pct: Optional[float] = Field(
        default=0.0,
        description="Hypothetical percentage change in revenue (-100 to +200)"
    )
    hypothetical_cost_reduction_pct: Optional[float] = Field(
        default=0.0,
        description="Hypothetical percentage reduction in operating expenses (-50 to +50)"
    )

class EBITDAScenarioOut(BaseModel):
    projected_revenue: float
    projected_operating_expenses: float
    projected_ebitda: float
    projected_ebitda_margin_pct: float
    ebitda_delta: float
    margin_delta_pct: float
    revenue_change_applied_pct: float
    cost_reduction_applied_pct: float
    disclaimer: str = (
        "Hypothetical Scenario — For illustrative sales discussion purposes only. "
        "Does not promise specific business outcomes or savings."
    )

class EBITDACalculationResponse(BaseModel):
    revenue: float
    operating_expenses: float
    interest: float = 0.0
    taxes: float = 0.0
    depreciation: float = 0.0
    amortization: float = 0.0
    d_and_a_total: float = 0.0
    ebitda: float
    ebitda_margin_pct: float
    margin_classification: str # "High (>25%)", "Healthy (15-25%)", "Moderate (8-15%)", "Compressed (<8%)", "Negative"
    scenario: Optional[EBITDAScenarioOut] = None

# ---------------------------------------------------------
# AI Call Prep Schemas
# ---------------------------------------------------------
class ObjectionRebuttal(BaseModel):
    objection: str
    rebuttal: str

class AICallPrepRequest(BaseModel):
    company_id: Optional[str] = None
    company_name: str
    industry: Optional[str] = None
    location: Optional[str] = None
    contact_name: Optional[str] = None
    contact_designation: Optional[str] = None
    business_challenges: Optional[str] = None
    revenue: Optional[float] = None
    operating_expenses: Optional[float] = None
    ebitda: Optional[float] = None
    ebitda_margin_pct: Optional[float] = None

class AICallPrepResponse(BaseModel):
    company_name: str
    opening_line: str
    discovery_questions: List[str]
    financial_efficiency_questions: List[str]
    objections_and_rebuttals: List[ObjectionRebuttal]
    ai_problem_solving: str
    closing_line: str
    missing_data_notes: List[str]
    model_used: str
    is_simulated: bool = False
    warning_or_notice: Optional[str] = None

# ---------------------------------------------------------
# Health Schema
# ---------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    environment: str
    groq_configured: bool
    groq_model: str
    database_mode: str # "supabase" or "in-memory-fallback"
    database_connected: bool

# ---------------------------------------------------------
# AI Prospect Discovery Schemas
# ---------------------------------------------------------
class ProspectDiscoveryRequest(BaseModel):
    industry: str = Field(..., description="Target industry e.g. Textile, Spinning, Automobile, etc.")
    geography: str = Field(default="India", description="Target geography e.g. India, Coimbatore, Pune, Gujarat")
    company_size: str = Field(default="Any", description="Small, Medium, Large, or Any")
    limit: int = Field(default=1, ge=1, le=50, description="1, 5, 10, or 25")
    additional_requirements: Optional[str] = Field(None, description="Custom research focus instructions")

class DiscoveredProspect(BaseModel):
    id: Optional[str] = None
    company_name: str
    website: Optional[str] = None
    industry: str = "Other Manufacturing"
    location: str = "India"
    products_services: Optional[str] = None
    company_size: str = "Medium"
    revenue: Optional[float] = None
    operating_expenses: Optional[float] = None
    ebitda: Optional[float] = None
    ebitda_margin_pct: Optional[float] = None
    expansion_news: Optional[str] = None
    source_urls: List[str] = Field(default_factory=list)
    research_date: Optional[str] = None
    contact_name: Optional[str] = None
    contact_designation: Optional[str] = None
    prospect_fit_score: int = Field(default=75, ge=0, le=100)
    fit_score_reason: str = ""
    evidence_confidence: str = "Medium"  # "High" | "Medium" | "Low"
    potential_discovery_angle: str = ""
    research_summary: str = ""
    is_saved_in_accounts: bool = False
    existing_account_id: Optional[str] = None

class ProspectDiscoveryResponse(BaseModel):
    success: bool = True
    industry: str
    geography: str
    total_found: int
    prospects: List[DiscoveredProspect]
    research_timestamp: str
    search_grounding_used: bool = True
    provider_notice: Optional[str] = None

class AddProspectTargetRequest(BaseModel):
    prospect: DiscoveredProspect
    force_update: bool = False

class AddProspectTargetResponse(BaseModel):
    success: bool
    already_exists: bool
    message: str
    company_id: str
    company: CompanyOut
