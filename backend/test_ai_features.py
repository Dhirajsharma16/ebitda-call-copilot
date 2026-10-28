import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_dir = r"C:\Users\PEL\.gemini\antigravity\scratch\ebitda-call-copilot\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import db
from app.config import settings
from app.schemas import AICallPrepRequest, ObjectionRebuttal
from app.services.gemini_service import _extract_json_from_text, generate_gemini_call_prep
from app.services.groq_service import generate_rule_based_fallback, generate_call_prep
from app.services.discovery_service import discover_companies, ProspectDiscoveryRequest

client = TestClient(app)

class TestEbitdaCallCopilotAIFeatures(unittest.TestCase):

    def setUp(self):
        # Ensure fresh state
        pass

    # -------------------------------------------------------------
    # 1. HEALTH & CONNECTIVITY
    # -------------------------------------------------------------
    def test_01_health_check(self):
        """Verify API health endpoint reports status and database mode."""
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("database_mode", data)
        self.assertTrue(data["database_connected"])
        print("[PASS] 1. Health check & database connectivity verified")

    # -------------------------------------------------------------
    # 2. EBITDA CALCULATOR & WHAT-IF MODELER
    # -------------------------------------------------------------
    def test_02_ebitda_calculation_and_whatif_scenario(self):
        """Verify EBITDA calculation, margin classification, and what-if sensitivity modeling."""
        payload = {
            "revenue": 50000000.0,
            "operating_expenses": 42000000.0,
            "interest": 1000000.0,
            "taxes": 1500000.0,
            "depreciation": 2000000.0,
            "amortization": 500000.0,
            "hypothetical_revenue_change_pct": 5.0,
            "hypothetical_cost_reduction_pct": 4.0
        }
        response = client.post("/api/calculator/ebitda", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Baseline EBITDA = 50M - 42M = 8M
        self.assertEqual(data["ebitda"], 8000000.0)
        # Margin = (8M / 50M) * 100 = 16.0% -> Healthy
        self.assertEqual(data["ebitda_margin_pct"], 16.0)
        self.assertEqual(data["margin_classification"], "Healthy (15-25%)")
        self.assertEqual(data["d_and_a_total"], 2500000.0)

        # What-If Scenario Check
        scenario = data["scenario"]
        # Projected revenue (+5%): 50M * 1.05 = 52.5M
        self.assertEqual(scenario["projected_revenue"], 52500000.0)
        # Projected OpEx (-4%): 42M * 0.96 = 40.32M
        self.assertEqual(scenario["projected_operating_expenses"], 40320000.0)
        # Projected EBITDA: 52.5M - 40.32M = 12.18M
        self.assertEqual(scenario["projected_ebitda"], 12180000.0)
        # Delta EBITDA: 12.18M - 8M = +4.18M
        self.assertEqual(scenario["ebitda_delta"], 4180000.0)
        self.assertIn("Hypothetical Scenario", scenario["disclaimer"])
        print("[PASS] 2. EBITDA Calculator & What-If Scenario Modeler verified accurately")

    # -------------------------------------------------------------
    # 3. AI COLD CALL ASSISTANT (STRATEGY GENERATION)
    # -------------------------------------------------------------
    def test_03_ai_call_prep_synthesis_fallback(self):
        """Verify AI Cold Call Assistant generates all 6 core sales sections using the synthesis engine."""
        payload = {
            "company_name": "Apex Industrial Logistics Corp",
            "industry": "Transportation & Logistics",
            "location": "Dallas, TX, USA",
            "contact_name": "Marcus Vance",
            "contact_designation": "Chief Executive Officer",
            "business_challenges": "Rising diesel fuel prices and fleet turnaround bottlenecks",
            "revenue": 42500000.0,
            "operating_expenses": 38250000.0,
            "ebitda": 4250000.0,
            "ebitda_margin_pct": 10.0
        }
        response = client.post("/api/ai/prepare-call", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check all 6 core sections exist and are populated
        self.assertTrue(len(data["opening_line"]) > 20)
        self.assertIn("Marcus Vance", data["opening_line"])
        self.assertGreaterEqual(len(data["discovery_questions"]), 3)
        self.assertGreaterEqual(len(data["financial_efficiency_questions"]), 2)
        self.assertGreaterEqual(len(data["objections_and_rebuttals"]), 2)
        for obj in data["objections_and_rebuttals"]:
            self.assertTrue(len(obj["objection"]) > 5)
            self.assertTrue(len(obj["rebuttal"]) > 10)
        self.assertTrue(len(data["ai_problem_solving"]) > 20)
        self.assertTrue(len(data["closing_line"]) > 10)
        print("[PASS] 3. AI Cold Call Prep generated 6 core sections successfully")

    def test_04_ai_call_prep_missing_data_notes(self):
        """Verify AI notes unsupplied revenue figures in missing_data_notes rather than guessing."""
        payload = {
            "company_name": "Unknown Tech Corp",
            "industry": "Software",
            # revenue and opex missing
        }
        response = client.post("/api/ai/prepare-call", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        missing_notes = data["missing_data_notes"]
        self.assertTrue(any("revenue" in n.lower() for n in missing_notes))
        print("[PASS] 4. AI Cold Call Assistant correctly flags unsupplied data in missing_data_notes")

    def test_05_ai_call_prep_validation(self):
        """Verify API raises 422 Unprocessable Entity when company name is missing."""
        response = client.post("/api/ai/prepare-call", json={"company_name": "   "})
        self.assertEqual(response.status_code, 422)
        print("[PASS] 5. AI Cold Call Assistant validates company name requirement")

    def test_06_gemini_llm_json_parsing(self):
        """Verify robust JSON extraction from markdown code fences for Gemini LLM output."""
        markdown_json = '```json\n{\n  "opening_line": "Natural opener",\n  "discovery_questions": ["Q1"],\n  "financial_efficiency_questions": ["F1"],\n  "objections_and_rebuttals": [{"objection": "O1", "rebuttal": "R1"}],\n  "ai_problem_solving": "Conditional framework",\n  "closing_line": "Closing line",\n  "missing_data_notes": []\n}\n```'
        parsed = _extract_json_from_text(markdown_json)
        self.assertEqual(parsed["opening_line"], "Natural opener")
        self.assertEqual(len(parsed["discovery_questions"]), 1)
        self.assertEqual(parsed["objections_and_rebuttals"][0]["objection"], "O1")
        print("[PASS] 6. Gemini JSON extractor correctly parses markdown code blocks")

    # -------------------------------------------------------------
    # 4. AI EXECUTIVE FOLLOW-UP EMAIL GENERATION
    # -------------------------------------------------------------
    def test_07_ai_follow_up_email_generation(self):
        """Verify AI post-call follow-up email generates tailored subject and body."""
        payload = {
            "company_name": "Craftsman Automation Limited",
            "contact_name": "Srinivasan Ravi",
            "contact_designation": "Managing Director",
            "notes": "Discussed CNC machining scrap reduction and casting yield in Coimbatore plants.",
            "ebitda": 9350000000.0,
            "ebitda_margin_pct": 21.0,
            "follow_up_date": "2026-11-03"
        }
        response = client.post("/api/ai/follow-up-email", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("subject", data)
        self.assertIn("body", data)
        self.assertIn("Craftsman Automation Limited", data["subject"])
        self.assertIn("Srinivasan Ravi", data["body"])
        self.assertIn("2026-11-03", data["body"])
        print("[PASS] 7. AI Executive Follow-up Email generated with prospect and date context")

    # -------------------------------------------------------------
    # 5. AI COMPANY RESEARCH & BENCHMARKING
    # -------------------------------------------------------------
    def test_08_ai_company_research(self):
        """Verify AI company research generates typical operational bottlenecks, benchmarks, and hooks."""
        payload = {
            "company_name": "K.P.R. Mill Limited",
            "industry": "Spinning & Textile"
        }
        response = client.post("/api/ai/research-company", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        res_data = data["data"]
        self.assertIn("business_challenges", res_data)
        self.assertIn("typical_ebitda_margin_range", res_data)
        self.assertIn("executive_hook", res_data)
        print("[PASS] 8. AI Company Research auto-generates bottlenecks, margins, and hooks")

    # -------------------------------------------------------------
    # 6. AI PROSPECT DISCOVERY & QUALIFICATION ENGINE
    # -------------------------------------------------------------
    def test_09_prospect_discovery_options(self):
        """Verify discovery options endpoint returns available industries and geography presets."""
        response = client.get("/api/discovery/options")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("industries", data)
        self.assertIn("geography_presets", data)
        self.assertIn("Textile", data["industries"])
        self.assertIn("Automobile", data["industries"])
        print("[PASS] 9. AI Discovery options endpoint verified")

    def test_10_prospect_discovery_search(self):
        """Verify AI Prospect Discovery finds verified companies, calculates fit score and AI diagnostic angle."""
        payload = {
            "industry": "Spinning",
            "geography": "Tamil Nadu (Coimbatore / Tirupur / Chennai)",
            "company_size": "Any",
            "limit": 5
        }
        response = client.post("/api/discovery/search", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertGreaterEqual(data["total_found"], 1)
        prospects = data["prospects"]
        top = prospects[0]
        self.assertIn("company_name", top)
        self.assertIn("prospect_fit_score", top)
        self.assertGreaterEqual(top["prospect_fit_score"], 70)
        self.assertIn("potential_discovery_angle", top)
        self.assertTrue(len(top["potential_discovery_angle"]) > 10)
        self.assertIn("source_urls", top)
        self.assertGreaterEqual(len(top["source_urls"]), 1)
        print(f"[PASS] 10. AI Prospect Discovery found {data['total_found']} prospects (Top: {top['company_name']}, Fit: {top['prospect_fit_score']})")

    def test_11_prospect_discovery_add_target(self):
        """Verify discovered prospect can be saved to Target Accounts with deduplication."""
        # First discovery search
        payload = {
            "industry": "Auto Components",
            "geography": "Maharashtra (Pune / Chakan / Aurangabad / Mumbai)",
            "company_size": "Any",
            "limit": 3
        }
        resp = client.post("/api/discovery/search", json=payload)
        prospects = resp.json()["prospects"]
        self.assertGreaterEqual(len(prospects), 1)
        target_prospect = prospects[0]

        # Add to Target Accounts
        add_resp = client.post("/api/discovery/add-target", json={
            "prospect": target_prospect,
            "force_update": False
        })
        self.assertEqual(add_resp.status_code, 200)
        res_json = add_resp.json()
        self.assertTrue(res_json["success"])
        self.assertIn("company_id", res_json)

        # Verify company is now retrievable in target accounts
        comp_id = res_json["company_id"]
        get_comp = client.get(f"/api/companies/{comp_id}")
        self.assertEqual(get_comp.status_code, 200)
        self.assertEqual(get_comp.json()["company"]["company_name"], target_prospect["company_name"])
        print("[PASS] 11. Discovered Prospect saved to Target Accounts successfully")

    # -------------------------------------------------------------
    # 7. CALL LOGGING & FOLLOW-UP TIMELINE
    # -------------------------------------------------------------
    def test_12_call_logging_and_followup_status(self):
        """Verify cold call logging, outcome tagging, and follow-up pipeline tracking."""
        companies = client.get("/api/companies").json()
        self.assertGreater(len(companies), 0)
        comp = companies[0]

        call_payload = {
            "company_id": comp["id"],
            "contact_name": comp.get("contact_name") or "Marcus Vance",
            "notes": "Spoke about 3% EBITDA optimization. Executive agreed to a 15-minute diagnostic next week.",
            "call_outcome": "Interested",
            "follow_up_date": "2026-11-04T10:00:00Z",
            "ai_preparation": {
                "opening_line": "Noticed recent fleet expansion...",
                "discovery_questions": ["What is your biggest cost driver?"]
            }
        }
        res = client.post("/api/calls", json=call_payload)
        self.assertIn(res.status_code, [200, 201])
        call_rec = res.json()
        self.assertEqual(call_rec["company_id"], comp["id"])
        self.assertEqual(call_rec["call_outcome"], "Interested")

        # Verify call appears in /api/calls
        calls_list = client.get(f"/api/calls?company_id={comp['id']}").json()
        self.assertTrue(any(c["id"] == call_rec["id"] for c in calls_list))

        # Verify follow-up pipeline summary
        fu_res = client.get("/api/follow-ups")
        self.assertEqual(fu_res.status_code, 200)
        fu_data = fu_res.json()
        self.assertGreaterEqual(fu_data["total_pending"], 1)
        print("[PASS] 12. Call logging, AI prep storage, and follow-up timeline verified")

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEbitdaCallCopilotAIFeatures)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n=======================================================")
        print("ALL 12/12 AI FEATURES & INTEGRATION TESTS PASSED 100%!")
        print("=======================================================")
        sys.exit(0)
    else:
        sys.exit(1)
