import os
import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas import AICallPrepRequest, AICallPrepResponse, ObjectionRebuttal

logger = logging.getLogger(__name__)

FALLBACK_PROMPT = """You are an elite B2B Sales Executive & Financial Strategist preparing for a high-stakes cold call with a CEO, MD, or Senior Executive.

Given the verified company information and financial metrics provided below, generate a professional, fact-anchored cold call strategy.

CRITICAL COLD CALLING RULES:
1. FACTUAL INTEGRITY: ONLY reference information supplied in the prompt. NEVER invent company facts, customer names, financial figures, or unverified claims.
2. 20-SECOND NATURAL OPENING: The opening line MUST be natural, peer-to-peer, conversational, and calibrated for an unhurried ~20-second delivery (~35-45 words). It must acknowledge their role, bridge to their sector margin reality, and pause with a low-pressure open question.
3. OPEN-ENDED DISCOVERY (3-5 QUESTIONS): Provide 3 to 5 truly open-ended discovery questions (starting with How, What, In what ways, Walk me through) that investigate operational bottlenecks. Avoid closed yes/no questions.
4. DISCOVERY-FIRST PRINCIPLE (DO NOT SELL AI UPFRONT): Do NOT prescribe a specific AI product or feature before the problem is validated. The 'ai_problem_solving' output MUST be conditional: e.g., "If [Executive] validates that [bottleneck] is indeed eroding margins, you can then conditionally explore how diagnostic telemetry isolates root causes..."
5. RESPECTFUL & CONCISE: Zero sales hype, no aggressive pitches, appropriate for a CEO/MD discussion.

Output Schema:
{
  "opening_line": "Natural ~20-second peer-to-peer conversational opener (~35-45 words)",
  "discovery_questions": ["q1", "q2", "q3", "q4"],
  "financial_efficiency_questions": ["f1", "f2", "f3"],
  "objections_and_rebuttals": [
    {"objection": "...", "rebuttal": "..."},
    {"objection": "...", "rebuttal": "..."}
  ],
  "ai_problem_solving": "Conditional diagnostic framework: only to be introduced once executive confirms the bottleneck.",
  "closing_line": "Natural low-friction closing line requesting a brief 15-minute follow-up meeting.",
  "missing_data_notes": ["Any unverified or missing data points the salesperson should verify during the call"]
}
"""

def generate_rule_based_fallback(data: AICallPrepRequest, notice: str) -> AICallPrepResponse:
    """High-quality fallback synthesis if Groq API is unavailable or unconfigured."""
    name = data.company_name or "the company"
    contact = data.contact_name or "there"
    title = data.contact_designation or "Executive"
    industry = data.industry or "General Business"
    challenges = data.business_challenges or "operational efficiency and cost optimization"
    has_financials = (data.revenue is not None and data.revenue > 0)
    ebitda_val = f"${data.ebitda:,.0f}" if (data.ebitda is not None and has_financials) else "unreported"
    margin_val = f"{data.ebitda_margin_pct:.1f}%" if (data.ebitda_margin_pct is not None and has_financials) else "unreported"

    missing = []
    if not data.revenue or data.revenue == 0:
        missing.append("Verified revenue figure (currently unsupplied)")
    if not data.operating_expenses or data.operating_expenses == 0:
        missing.append("Current operating cost baseline (excluding D&A)")
    if not data.contact_name:
        missing.append("Direct contact person name")
    if not data.business_challenges:
        missing.append("Specific known operational bottlenecks or margin headwinds")

    opening = (
        f"Hi {contact}, I know you're leading {industry.lower() if industry else ''} operations at {name}. "
        f"I'm reaching out because several peers in your space have been reviewing ways to protect operating margins "
        f"against rising operational overhead—curious how that's tracking for you this quarter."
    )

    discovery = [
        f"As {title} at {name}, what is the primary operational or margin hurdle your leadership team is focused on solving right now?",
        f"When evaluating issues like {challenges.split('.')[0] if '.' in challenges else challenges}, how much visibility do you currently have into root causes?",
        "How have recent cost pressures or market shifts impacted your planned strategic investments for this fiscal year?",
        "If your team could automate or streamline one friction point in your core workflow, which department would see the biggest uplift?"
    ]

    financial_questions = [
        f"With your sector's typical EBITDA margins, how sensitive is your bottom line to a 2-3% variance in core operating expenses?",
        "Are your cost-containment initiatives focused primarily on immediate vendor/headcount reductions or systematic process efficiency?",
        f"How quickly does your leadership team spot margin leakage before it impacts end-of-quarter financial reporting?"
    ]

    objections = [
        ObjectionRebuttal(
            objection="We already have internal systems or legacy vendors handling this.",
            rebuttal="Completely understand—most leaders we speak with already have legacy tools in place. We don't replace your tech stack; we augment it specifically where data silos cause hidden EBITDA leakage."
        ),
        ObjectionRebuttal(
            objection="We have no budget or our budget is frozen for new initiatives.",
            rebuttal="That makes total sense right now. This call isn't about buying software today—it's about benchmarking your operational efficiency against top performers so you have options ready when budgeting opens."
        ),
        ObjectionRebuttal(
            objection="I'm too busy, just send me an email with information.",
            rebuttal="I respect your time, so I won't clutter your inbox with generic brochures. If I send a customized 1-page financial impact teardown specific to your business challenges, would you have 10 minutes next Tuesday to give feedback?"
        )
    ]

    ai_solving = (
        f"Discovery-First Rule: Do NOT prescribe an AI solution upfront. "
        f"If {contact} confirms on the call that {challenges.lower()} is directly impacting their operating margin, "
        f"you can conditionally introduce how telemetry and diagnostic analytics pinpoint cost leakages in real-time "
        f"without forcing an immediate vendor commitment."
    )

    closing = (
        f"{contact}, I know you have a packed calendar. Would you be open to a brief 15-minute introductory conversation next Tuesday or Thursday morning to see how this compares to your current roadmap?"
    )

    return AICallPrepResponse(
        company_name=name,
        opening_line=opening,
        discovery_questions=discovery,
        financial_efficiency_questions=financial_questions,
        objections_and_rebuttals=objections,
        ai_problem_solving=ai_solving,
        closing_line=closing,
        missing_data_notes=missing,
        model_used="rule-based-synthesis-engine",
        is_simulated=True,
        warning_or_notice=notice
    )

async def generate_call_prep(data: AICallPrepRequest) -> AICallPrepResponse:
    """Prepares cold call strategy using Groq LLM, with resilient fallback."""
    api_key = settings.GROQ_API_KEY.strip()
    model = settings.GROQ_MODEL.strip() or "llama-3.3-70b-versatile"

    if not api_key:
        return generate_rule_based_fallback(
            data,
            notice="GROQ_API_KEY is not configured in backend environment. Generated high-quality tailored strategy using synthesis engine. To enable live Groq LLM responses, set GROQ_API_KEY in backend/.env or Render."
        )

    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=api_key)

        prompt_payload = {
            "company_name": data.company_name,
            "industry": data.industry,
            "location": data.location,
            "contact_name": data.contact_name,
            "contact_designation": data.contact_designation,
            "business_challenges": data.business_challenges,
            "financial_data": {
                "revenue": data.revenue,
                "operating_expenses": data.operating_expenses,
                "ebitda": data.ebitda,
                "ebitda_margin_pct": data.ebitda_margin_pct
            }
        }

        user_content = f"Company Profile and Financial Data:\n{json.dumps(prompt_payload, indent=2)}\n\nGenerate cold call preparation JSON according to system instructions."

        completion = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": FALLBACK_PROMPT},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=1500,
        )

        raw_json_str = completion.choices[0].message.content
        parsed = json.loads(raw_json_str)

        # Build objection models
        objections = []
        for obj in parsed.get("objections_and_rebuttals", []):
            if isinstance(obj, dict):
                objections.append(ObjectionRebuttal(
                    objection=obj.get("objection", ""),
                    rebuttal=obj.get("rebuttal", "")
                ))

        # Check for missing data
        missing = parsed.get("missing_data_notes", [])
        if not data.revenue or data.revenue == 0:
            if "Revenue figure not supplied by user" not in missing:
                missing.append("Revenue figure not supplied by user")
        if not data.business_challenges:
            if "Specific company challenges not provided" not in missing:
                missing.append("Specific company challenges not provided")

        return AICallPrepResponse(
            company_name=data.company_name,
            opening_line=parsed.get("opening_line", ""),
            discovery_questions=parsed.get("discovery_questions", []),
            financial_efficiency_questions=parsed.get("financial_efficiency_questions", []),
            objections_and_rebuttals=objections,
            ai_problem_solving=parsed.get("ai_problem_solving", ""),
            closing_line=parsed.get("closing_line", ""),
            missing_data_notes=missing,
            model_used=model,
            is_simulated=False,
            warning_or_notice=None
        )

    except Exception as e:
        logger.error(f"Groq API call error: {str(e)}")
        return generate_rule_based_fallback(
            data,
            notice=f"Groq API call encountered an error ({type(e).__name__}: {str(e)}). Switched safely to fallback synthesis engine so call preparation is not disrupted."
        )
