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
