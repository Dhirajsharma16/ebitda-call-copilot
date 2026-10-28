import sys
import unittest
from unittest.mock import patch, MagicMock, AsyncMock

backend_dir = r"C:\Users\PEL\.gemini\antigravity\scratch\ebitda-call-copilot\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas import AICallPrepRequest
from app.services.gemini_service import generate_gemini_call_prep
from app.services.groq_service import generate_call_prep as generate_groq_call_prep
from app.config import settings

class TestLiveLLMMock(unittest.IsolatedAsyncioTestCase):

    @patch("app.services.gemini_service._call_gemini_interaction")
    async def test_gemini_live_flow(self, mock_gemini):
        # Mock Gemini LLM returning structured JSON
        mock_gemini.return_value = '''```json
{
  "opening_line": "Marcus, noticed Apex expanded fleet routes across the south corridor...",
  "discovery_questions": [
    "How are recent diesel price fluctuations affecting your line-haul route margins?",
    "What process does your dispatch team use to identify delayed carrier handoffs?",
    "In what ways have tire wear and unplanned maintenance impacted fleet availability?"
  ],
  "financial_efficiency_questions": [
    "With a 10% EBITDA margin, how sensitive is quarterly net profit to a 2% variance in fuel spend?",
    "How quickly does executive leadership receive visibility into route-level EBITDA drag?"
  ],
  "objections_and_rebuttals": [
    {
      "objection": "We already have telematics software installed across our fleet.",
      "rebuttal": "We integrate alongside your existing telematics to isolate hidden cost leakage."
    }
  ],
  "ai_problem_solving": "If Marcus validates that diesel overhead is eroding route margins, conditionally introduce telematics telemetry.",
  "closing_line": "Would you have 15 minutes next Tuesday morning to review our route margin benchmark?",
  "missing_data_notes": []
}
```'''
        with patch.object(settings, "GEMINI_API_KEY", "test-valid-gemini-key"):
            req = AICallPrepRequest(
                company_name="Apex Industrial Logistics Corp",
                industry="Transportation & Logistics",
                contact_name="Marcus Vance",
                contact_designation="CEO",
                business_challenges="Diesel cost escalation",
                revenue=42500000.0,
                operating_expenses=38250000.0,
                ebitda=4250000.0,
                ebitda_margin_pct=10.0
            )
            res = await generate_gemini_call_prep(req)
            self.assertFalse(res.is_simulated)
            self.assertIn("Google Gemini", res.model_used)
            self.assertIn("Marcus, noticed Apex expanded fleet routes", res.opening_line)
            self.assertEqual(len(res.discovery_questions), 3)
            self.assertEqual(len(res.financial_efficiency_questions), 2)
            self.assertEqual(len(res.objections_and_rebuttals), 1)
            self.assertEqual(res.objections_and_rebuttals[0].objection, "We already have telematics software installed across our fleet.")
            print("[PASS] Gemini LLM parsing, model assignment, and structure verified!")

    @patch("groq.AsyncGroq")
    async def test_groq_live_flow(self, mock_groq_cls):
        mock_client = MagicMock()
        mock_groq_cls.return_value = mock_client
        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = '''{
  "opening_line": "Hi Marcus, noticed Apex expanded operations...",
  "discovery_questions": ["Q1", "Q2", "Q3"],
  "financial_efficiency_questions": ["F1", "F2"],
  "objections_and_rebuttals": [{"objection": "Budget frozen", "rebuttal": "This is exploratory benchmarking."}],
  "ai_problem_solving": "Conditional diagnostic introduction...",
  "closing_line": "Would you be open to a 15-minute sync next Thursday?",
  "missing_data_notes": []
}'''
        mock_completion.choices = [mock_choice]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)

        with patch.object(settings, "GROQ_API_KEY", "test-valid-groq-key"):
            req = AICallPrepRequest(
                company_name="Apex Industrial Logistics Corp",
                industry="Transportation & Logistics",
                contact_name="Marcus Vance",
                contact_designation="CEO",
                business_challenges="Diesel costs",
                revenue=42500000.0,
                operating_expenses=38250000.0
            )
            res = await generate_groq_call_prep(req)
            self.assertFalse(res.is_simulated)
            self.assertIn("llama-3.3-70b-versatile", res.model_used)
            self.assertEqual(len(res.discovery_questions), 3)
            print("[PASS] Groq LLM parsing, model assignment, and structure verified!")

if __name__ == "__main__":
    unittest.main()
