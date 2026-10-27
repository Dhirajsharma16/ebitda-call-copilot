from typing import Dict, Any, Optional
from app.schemas import (
    EBITDACalculationRequest,
    EBITDACalculationResponse,
    EBITDAScenarioOut,
)

def calculate_ebitda_and_scenario(data: EBITDACalculationRequest) -> EBITDACalculationResponse:
    revenue = round(float(data.revenue), 2)
    operating_expenses = round(float(data.operating_expenses), 2)
    interest = round(float(data.interest or 0.0), 2)
    taxes = round(float(data.taxes or 0.0), 2)
    depreciation = round(float(data.depreciation or 0.0), 2)
    amortization = round(float(data.amortization or 0.0), 2)

    ebitda = round(revenue - operating_expenses, 2)
    
    # Safe margin calculation: handle zero revenue or negative values
    if revenue > 0:
        ebitda_margin_pct = round((ebitda / revenue) * 100.0, 2)
    else:
        ebitda_margin_pct = 0.0

    # Classification
    if ebitda < 0:
        classification = "Negative Margin"
    elif ebitda_margin_pct >= 25.0:
        classification = "High (>25%)"
    elif ebitda_margin_pct >= 15.0:
        classification = "Healthy (15-25%)"
    elif ebitda_margin_pct >= 8.0:
        classification = "Moderate (8-15%)"
    else:
        classification = "Compressed (<8%)"

    scenario_out: Optional[EBITDAScenarioOut] = None

    # Calculate hypothetical scenario if either slider/input is supplied or non-zero
    rev_change_pct = float(data.hypothetical_revenue_change_pct or 0.0)
    cost_reduction_pct = float(data.hypothetical_cost_reduction_pct or 0.0)

    # Compute scenario projection
    projected_revenue = round(revenue * (1.0 + (rev_change_pct / 100.0)), 2)
    # Cost reduction of 10% means new cost = cost * (1 - 0.10)
    projected_opex = round(max(0.0, operating_expenses * (1.0 - (cost_reduction_pct / 100.0))), 2)
    projected_ebitda = round(projected_revenue - projected_opex, 2)
    
    if projected_revenue > 0:
        projected_margin = round((projected_ebitda / projected_revenue) * 100.0, 2)
    else:
        projected_margin = 0.0

    ebitda_delta = round(projected_ebitda - ebitda, 2)
    margin_delta = round(projected_margin - ebitda_margin_pct, 2)

    scenario_out = EBITDAScenarioOut(
        projected_revenue=projected_revenue,
        projected_operating_expenses=projected_opex,
        projected_ebitda=projected_ebitda,
        projected_ebitda_margin_pct=projected_margin,
        ebitda_delta=ebitda_delta,
        margin_delta_pct=margin_delta,
        revenue_change_applied_pct=rev_change_pct,
        cost_reduction_applied_pct=cost_reduction_pct,
    )

    return EBITDACalculationResponse(
        revenue=revenue,
        operating_expenses=operating_expenses,
        interest=interest,
        taxes=taxes,
        depreciation=depreciation,
        amortization=amortization,
        d_and_a_total=round(depreciation + amortization, 2),
        ebitda=ebitda,
        ebitda_margin_pct=ebitda_margin_pct,
        margin_classification=classification,
        scenario=scenario_out,
    )
