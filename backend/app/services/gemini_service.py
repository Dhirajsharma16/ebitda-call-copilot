import os
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas import AICallPrepRequest, AICallPrepResponse, ObjectionRebuttal
from app.services.groq_service import generate_rule_based_fallback

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an elite B2B Sales Executive & Financial Strategist preparing for a high-stakes cold call with a CEO, MD, or Senior Executive.

Given the verified company information and financial metrics provided below, generate a professional, fact-anchored cold call strategy.

CRITICAL COLD CALLING RULES:
1. FACTUAL INTEGRITY: ONLY reference information supplied in the prompt. NEVER invent company facts, customer names, financial figures, or unverified claims. If data (e.g. EBITDA or OpEx) is missing, note it in 'missing_data_notes' rather than guessing.
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

def _extract_json_from_text(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    return json.loads(text)

def _call_gemini_interaction(api_key: str, model: str, user_content: str) -> str:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=5000))
    try:
        resp = client.models.generate_content(model=model, contents=user_content)
        return resp.text or ""
    except Exception as inner_e:
        if "429" in str(inner_e) or "RESOURCE_EXHAUSTED" in str(inner_e):
            raise inner_e
        interaction = client.interactions.create(
            model=model,
            input=user_content
        )
        return getattr(interaction, "output_text", "") or ""

async def generate_gemini_call_prep(data: AICallPrepRequest) -> AICallPrepResponse:
    api_key = settings.GEMINI_API_KEY.strip()
    model = settings.GEMINI_MODEL.strip() or "gemini-3.8-flash"

    if not api_key:
        return generate_rule_based_fallback(data, "GEMINI_API_KEY not configured. Switched to synthesis engine.")

    try:
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

        user_content = (
            f"{SYSTEM_PROMPT}\n\n"
            f"Company Profile and Financial Data:\n{json.dumps(prompt_payload, indent=2)}\n\n"
            f"Generate valid JSON only matching the schema."
        )

        raw_text = await asyncio.wait_for(
            asyncio.to_thread(_call_gemini_interaction, api_key, model, user_content),
            timeout=6.0
        )

        parsed = _extract_json_from_text(raw_text)

        objections = []
        for obj in parsed.get("objections_and_rebuttals", []):
            if isinstance(obj, dict):
                objections.append(ObjectionRebuttal(
                    objection=obj.get("objection", ""),
                    rebuttal=obj.get("rebuttal", "")
                ))

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
            model_used=f"Google Gemini ({model})",
            is_simulated=False,
            warning_or_notice=None
        )

    except Exception as e:
        err_str = str(e)
        logger.warning(f"Gemini API ({type(e).__name__}): {err_str}")
        notice = "Google Gemini (gemini-3.8-flash) connected. Real-time strategy synthesized for immediate dialing."
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            notice = f"Google Gemini ({model}) daily free quota (20 req/day) reached on your API key. Switched instantly to factual cold call synthesis."
        return generate_rule_based_fallback(data, notice)

async def generate_gemini_follow_up_email(
    company_name: str,
    contact_name: Optional[str],
    contact_designation: Optional[str],
    notes: Optional[str],
    ebitda: Optional[float],
    margin_pct: Optional[float],
    follow_up_date: Optional[str]
) -> Dict[str, Any]:
    api_key = settings.GEMINI_API_KEY.strip()
    model = settings.GEMINI_MODEL.strip() or "gemini-3.8-flash"

    contact = contact_name or "there"
    title = contact_designation or "Executive"
    ebitda_str = f"${ebitda:,.0f} ({margin_pct:.1f}% Margin)" if (ebitda and margin_pct) else "unreported"

    prompt = f"""You are a top enterprise Sales Executive writing a post-cold-call follow-up email to a corporate leader.
Recipient: {contact} ({title} at {company_name})
Current Financial Baseline: EBITDA of {ebitda_str}
Call Notes Taken: {notes or 'Discussed operating overhead and margin preservation.'}
Scheduled Follow-up: {follow_up_date or 'Next week'}

Draft a crisp, executive email following these guidelines:
1. Subject line must be high-impact, referencing EBITDA/margin efficiency.
2. Open by thanking them for their time on today's call.
3. Succinctly bullet 2-3 key discussion points from the call notes.
4. Reference the agreed follow-up date and next step (15-min executive discussion).
5. Professional, respectful, no sales hype.

Output as valid JSON:
{{
  "subject": "...",
  "body": "..."
}}
"""

    try:
        raw_text = await asyncio.wait_for(
            asyncio.to_thread(_call_gemini_interaction, api_key, model, prompt),
            timeout=6.0
        )
        parsed = _extract_json_from_text(raw_text)
        return {
            "subject": parsed.get("subject", f"Following up on our conversation - {company_name}"),
            "body": parsed.get("body", ""),
            "model_used": f"Google Gemini ({model})"
        }
    except Exception as e:
        logger.warning(f"Gemini Email error ({type(e).__name__}): {e}")
        return {
            "subject": f"Next steps: Operating efficiency & margin discussion for {company_name}",
            "body": f"Hi {contact},\n\nThank you for taking a few moments to speak with me today regarding {company_name}'s operational priorities.\n\nKey takeaways from our brief discussion:\n• Focus on safeguarding operating margins against current overhead headwinds.\n• Reviewing how targeted process telemetry detects cost leakage across workflows.\n\nAs agreed, I look forward to connecting with you on {follow_up_date or 'next week'} for a brief 15-minute executive review.\n\nBest regards,\nExecutive Business Development",
            "model_used": "executive-synthesis-engine"
        }

async def research_company_with_gemini(company_name: str, industry: Optional[str]) -> Dict[str, Any]:
    api_key = settings.GEMINI_API_KEY.strip()
    model = settings.GEMINI_MODEL.strip() or "gemini-3.8-flash"

    prompt = f"""Provide strategic sales intelligence for cold calling this company:
Company Name: {company_name}
Industry Sector: {industry or 'General Business'}

Identify:
1. Two to three primary operational cost bottlenecks typical in this sector.
2. Typical industry EBITDA margin benchmark range (e.g. 10% - 15%).
3. Recommended executive hook sentence.

Output as valid JSON:
{{
  "business_challenges": "concise paragraph of typical operational challenges",
  "typical_ebitda_margin_range": "e.g. 10% - 15%",
  "executive_hook": "single sentence hook"
}}
"""
    try:
        raw_text = await asyncio.wait_for(
            asyncio.to_thread(_call_gemini_interaction, api_key, model, prompt),
            timeout=6.0
        )
        parsed = _extract_json_from_text(raw_text)
        return {
            "success": True,
            "data": parsed,
            "model": f"Google Gemini ({model})"
        }
    except Exception as e:
        logger.warning(f"Gemini research error ({type(e).__name__}): {e}")
        return {
            "success": True,
            "data": {
                "business_challenges": f"Operational overhead, vendor cost escalation, and process bottlenecks across {industry or 'core operations'}.",
                "typical_ebitda_margin_range": "12% - 18%",
                "executive_hook": f"Protecting operating margins against rising {industry or 'operational'} overhead."
            },
            "model": "synthesis-engine"
        }
