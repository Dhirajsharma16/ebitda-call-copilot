import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas import (
    CompanyCreate, CompanyUpdate, CompanyOut,
    CallRecordCreate, CallRecordUpdate, CallRecordOut, CallOutcome
)

logger = logging.getLogger(__name__)

# In-memory storage structures for graceful local development & fallback
_memory_companies: Dict[str, Dict[str, Any]] = {}
_memory_calls: Dict[str, Dict[str, Any]] = {}

def _get_supabase_client():
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY or settings.SUPABASE_PUBLISHABLE_KEY
    if not settings.SUPABASE_URL or not key:
        return None
    try:
        from supabase import create_client, Client
        return create_client(settings.SUPABASE_URL, key)
    except Exception as e:
        logger.warning(f"Could not initialize Supabase client: {e}")
        return None

def _enrich_company(comp: Dict[str, Any]) -> CompanyOut:
    revenue = float(comp.get("revenue") or 0.0)
    opex = float(comp.get("operating_expenses") or 0.0)
    ebitda = round(revenue - opex, 2)
    margin = round((ebitda / revenue * 100.0), 2) if revenue > 0 else 0.0

    created = comp.get("created_at")
    if isinstance(created, str):
        created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
    elif isinstance(created, datetime):
        created_dt = created
    else:
        created_dt = datetime.now(timezone.utc)

    updated = comp.get("updated_at")
    if isinstance(updated, str):
        updated_dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
    elif isinstance(updated, datetime):
        updated_dt = updated
    else:
        updated_dt = datetime.now(timezone.utc)

    return CompanyOut(
        id=str(comp["id"]),
        company_name=comp["company_name"],
        website=comp.get("website"),
        industry=comp.get("industry"),
        location=comp.get("location"),
        contact_name=comp.get("contact_name"),
        contact_designation=comp.get("contact_designation"),
        business_challenges=comp.get("business_challenges"),
        revenue=revenue,
        operating_expenses=opex,
        ebitda=ebitda,
        ebitda_margin_pct=margin,
        created_at=created_dt,
        updated_at=updated_dt,
    )

def _enrich_call(call: Dict[str, Any], company_name: Optional[str] = None) -> CallRecordOut:
    call_date = call.get("call_date")
    if isinstance(call_date, str):
        call_dt = datetime.fromisoformat(call_date.replace("Z", "+00:00"))
    elif isinstance(call_date, datetime):
        call_dt = call_date
    else:
        call_dt = datetime.now(timezone.utc)

    follow_dt = None
    follow_date = call.get("follow_up_date")
    if follow_date:
        if isinstance(follow_date, str):
            follow_dt = datetime.fromisoformat(follow_date.replace("Z", "+00:00"))
        elif isinstance(follow_date, datetime):
            follow_dt = follow_date

    created = call.get("created_at")
    if isinstance(created, str):
        created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
    elif isinstance(created, datetime):
        created_dt = created
    else:
        created_dt = datetime.now(timezone.utc)

    now = datetime.now(timezone.utc)
    is_overdue = False
    if follow_dt and follow_dt < now and call.get("call_outcome") in [CallOutcome.FOLLOW_UP_REQUIRED.value, CallOutcome.INTERESTED.value]:
        is_overdue = True

    return CallRecordOut(
        id=str(call["id"]),
        company_id=str(call["company_id"]),
        company_name=company_name or call.get("company_name"),
        contact_name=call.get("contact_name"),
        call_date=call_dt,
        notes=call.get("notes"),
        call_outcome=call.get("call_outcome"),
        follow_up_date=follow_dt,
        ai_preparation=call.get("ai_preparation"),
        created_at=created_dt,
        is_overdue=is_overdue,
    )

class DatabaseService:
    def __init__(self):
        self._seed_in_memory()

    def _seed_in_memory(self):
        global _memory_companies, _memory_calls
        if _memory_companies:
            return

        now = datetime.now(timezone.utc)
        
        sample_companies = [
            {
                "id": "a1111111-1111-1111-1111-111111111111",
                "company_name": "RapidRoute Trucking & Fleet",
                "website": "https://rapidroute-fleet.example.com",
                "industry": "Transportation & Logistics",
                "location": "Dallas, TX, USA",
                "contact_name": "John Miller",
                "contact_designation": "Chief Executive Officer",
                "business_challenges": "Diesel fuel and truck maintenance consume 92% of all revenue. Operating at a tight 8% EBITDA margin where any fuel price hike wipes out net profit.",
                "revenue": 50000000.0,
                "operating_expenses": 46000000.0,
                "created_at": now - timedelta(days=5),
                "updated_at": now - timedelta(days=1),
            },
            {
                "id": "b2222222-2222-2222-2222-222222222222",
                "company_name": "CloudSync Software",
                "website": "https://cloudsync-software.example.com",
                "industry": "Enterprise Software / SaaS",
                "location": "Boston, MA, USA",
                "contact_name": "David Chen",
                "contact_designation": "VP of Sales & Operations",
                "business_challenges": "AWS cloud server hosting costs jumped 25% YoY, threatening their 30% EBITDA margin target before the upcoming investor funding round.",
                "revenue": 20000000.0,
                "operating_expenses": 14000000.0,
                "created_at": now - timedelta(days=7),
                "updated_at": now - timedelta(days=2),
            },
            {
                "id": "c3333333-3333-3333-3333-333333333333",
                "company_name": "GreenBean Coffee Cafes",
                "website": "https://greenbean-cafes.example.com",
                "industry": "Retail & Food Chain",
                "location": "Chicago, IL, USA",
                "contact_name": "Sarah Adams",
                "contact_designation": "Chief Operating Officer",
                "business_challenges": "Perishable dairy and coffee bean waste across 40 regional cafes is leaking $500,000/year, keeping their EBITDA margin compressed at 15%.",
                "revenue": 15000000.0,
                "operating_expenses": 12750000.0,
                "created_at": now - timedelta(days=10),
                "updated_at": now - timedelta(days=4),
            },
            {
                "id": "d4444444-4444-4444-4444-444444444444",
                "company_name": "Precision Metal Parts",
                "website": "https://precision-metalparts.example.com",
                "industry": "Manufacturing",
                "location": "Cleveland, OH, USA",
                "contact_name": "Elena Rostova",
                "contact_designation": "Managing Director",
                "business_challenges": "CNC machine scrap rate at 4.8% is wasting $1.2M in raw aluminum and steel. Looking to optimize production efficiency to protect a 20% margin.",
                "revenue": 30000000.0,
                "operating_expenses": 24000000.0,
                "created_at": now - timedelta(days=12),
                "updated_at": now - timedelta(days=6),
            },
            {
                "id": "e5555555-5555-5555-5555-555555555555",
                "company_name": "MetroHealth Medical Centers",
                "website": "https://metrohealth-centers.example.com",
                "industry": "Healthcare Services",
                "location": "Atlanta, GA, USA",
                "contact_name": "Dr. Robert Sterling",
                "contact_designation": "Executive Managing Director",
                "business_challenges": "Manual insurance billing paperwork errors cause 45-day reimbursement delays and tie up $3.5M in clinic cash flow.",
                "revenue": 40000000.0,
                "operating_expenses": 30000000.0,
                "created_at": now - timedelta(days=14),
                "updated_at": now - timedelta(days=3),
            }
        ]

        for c in sample_companies:
            _memory_companies[c["id"]] = c

        sample_calls = [
            {
                "id": "f1111111-1111-1111-1111-111111111111",
                "company_id": "a1111111-1111-1111-1111-111111111111",
                "contact_name": "John Miller",
                "call_date": now - timedelta(days=2),
                "notes": "Spoke with CEO John. He said diesel fuel costs are eating 92% of their sales. He agreed that cutting fuel waste by 3% saves them $1.3M straight to EBITDA. Promised to send a 1-page breakdown and call him back Tuesday at 10 AM.",
                "call_outcome": "Follow-up Required",
                "follow_up_date": now - timedelta(days=1), # Overdue for instant UI demonstration
                "ai_preparation": {
                    "opening_line": "John, noticed RapidRoute expanded interstate delivery fleets—curious how you are safeguarding your 8% operating margin against diesel spikes.",
                    "discovery_questions": ["What is your single biggest cost driver on fuel?", "How quickly does dispatch identify route margin decay?"]
                },
                "created_at": now - timedelta(days=2),
            },
            {
                "id": "f2222222-2222-2222-2222-222222222222",
                "company_id": "c3333333-3333-3333-3333-333333333333",
                "contact_name": "Sarah Adams",
                "call_date": now - timedelta(days=1),
                "notes": "Sarah confirmed cafe milk and food waste is costing them $500k/yr before their board meeting. Scheduled a 15-minute live demo on Thursday at 2 PM.",
                "call_outcome": "Interested",
                "follow_up_date": now + timedelta(days=3),
                "ai_preparation": {
                    "opening_line": "Sarah, reaching out because food chains we advise cut perishables waste by 18% to protect their 15% EBITDA margin.",
                    "discovery_questions": ["How much does store-level perishables waste impact your bottom line?"]
                },
                "created_at": now - timedelta(days=1),
            },
            {
                "id": "f3333333-3333-3333-3333-333333333333",
                "company_id": "b2222222-2222-2222-2222-222222222222",
                "contact_name": "David Chen",
                "call_date": now - timedelta(days=4),
                "notes": "Executive assistant answered; David was in an investor review. Left voicemail referencing how SaaS peers cut AWS server costs by 18% to protect their 30% margin.",
                "call_outcome": "No Answer",
                "follow_up_date": now + timedelta(days=2),
                "ai_preparation": None,
                "created_at": now - timedelta(days=4),
            },
            {
                "id": "f4444444-4444-4444-4444-444444444444",
                "company_id": "d4444444-4444-4444-4444-444444444444",
                "contact_name": "Elena Rostova",
                "call_date": now - timedelta(days=3),
                "notes": "Elena wants her head of factory operations on the call. Re-scheduled for next Monday to review machine defect inspection data.",
                "call_outcome": "Follow-up Required",
                "follow_up_date": now + timedelta(days=5),
                "ai_preparation": None,
                "created_at": now - timedelta(days=3),
            }
        ]

        for cl in sample_calls:
            _memory_calls[cl["id"]] = cl

    def get_status(self) -> Dict[str, Any]:
        sb = _get_supabase_client()
        if sb:
            try:
                # Quick health check query
                sb.table("companies").select("id").limit(1).execute()
                return {"mode": "supabase", "connected": True}
            except Exception as e:
                logger.warning(f"Supabase ping failed: {e}")
                return {"mode": "supabase (fallback to memory)", "connected": False, "error": str(e)}
        return {"mode": "in-memory-fallback", "connected": True}

    def list_companies(self, search: Optional[str] = None) -> List[CompanyOut]:
        sb = _get_supabase_client()
        if sb:
            try:
                query = sb.table("companies").select("*").order("created_at", desc=True)
                if search:
                    query = query.ilike("company_name", f"%{search}%")
                res = query.execute()
                if res.data and len(res.data) > 0:
                    return [_enrich_company(row) for row in res.data]
            except Exception as e:
                logger.error(f"Supabase list_companies error: {e}")

        # Fallback to in-memory store
        res = list(_memory_companies.values())
        if search:
            s = search.lower()
            res = [c for c in res if s in c["company_name"].lower() or (c.get("industry") and s in c["industry"].lower())]
        res.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return [_enrich_company(c) for c in res]

    def get_company(self, company_id: str) -> Optional[CompanyOut]:
        sb = _get_supabase_client()
        if sb:
            try:
                res = sb.table("companies").select("*").eq("id", company_id).execute()
                if res.data:
                    return _enrich_company(res.data[0])
            except Exception as e:
                logger.error(f"Supabase get_company error: {e}")

        comp = _memory_companies.get(company_id)
        if comp:
            return _enrich_company(comp)
        return None

    def create_company(self, data: CompanyCreate) -> CompanyOut:
        now = datetime.now(timezone.utc)
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "company_name": data.company_name,
            "website": data.website,
            "industry": data.industry,
            "location": data.location,
            "contact_name": data.contact_name,
            "contact_designation": data.contact_designation,
            "business_challenges": data.business_challenges,
            "revenue": data.revenue,
            "operating_expenses": data.operating_expenses,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        sb = _get_supabase_client()
        if sb:
            try:
                res = sb.table("companies").insert(record).execute()
                if res.data:
                    return _enrich_company(res.data[0])
            except Exception as e:
                logger.error(f"Supabase create_company error: {e}")

        _memory_companies[new_id] = record
        return _enrich_company(record)

    def update_company(self, company_id: str, data: CompanyUpdate) -> Optional[CompanyOut]:
        now = datetime.now(timezone.utc)
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        if not update_dict:
            return self.get_company(company_id)
        update_dict["updated_at"] = now.isoformat()

        sb = _get_supabase_client()
        if sb:
            try:
                res = sb.table("companies").update(update_dict).eq("id", company_id).execute()
                if res.data:
                    return _enrich_company(res.data[0])
            except Exception as e:
                logger.error(f"Supabase update_company error: {e}")

        if company_id in _memory_companies:
            _memory_companies[company_id].update(update_dict)
            return _enrich_company(_memory_companies[company_id])
        return None

    def delete_company(self, company_id: str) -> bool:
        sb = _get_supabase_client()
        if sb:
            try:
                sb.table("companies").delete().eq("id", company_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase delete_company error: {e}")

        if company_id in _memory_companies:
            del _memory_companies[company_id]
            # Also clean up calls
            calls_to_del = [cid for cid, cl in _memory_calls.items() if cl.get("company_id") == company_id]
            for cid in calls_to_del:
                del _memory_calls[cid]
            return True
        return False

    def list_calls(
        self,
        company_id: Optional[str] = None,
        outcome: Optional[str] = None,
        overdue_only: bool = False
    ) -> List[CallRecordOut]:
        sb = _get_supabase_client()
        if sb:
            try:
                query = sb.table("call_records").select("*, companies(company_name)").order("call_date", desc=True)
                if company_id:
                    query = query.eq("company_id", company_id)
                if outcome:
                    query = query.eq("call_outcome", outcome)
                res = query.execute()
                if res.data and len(res.data) > 0:
                    calls = []
                    for row in res.data:
                        comp_name = None
                        if "companies" in row and isinstance(row["companies"], dict):
                            comp_name = row["companies"].get("company_name")
                        c_out = _enrich_call(row, comp_name)
                        if overdue_only and not c_out.is_overdue:
                            continue
                        calls.append(c_out)
                    return calls
            except Exception as e:
                logger.error(f"Supabase list_calls error: {e}")

        # Fallback
        res = []
        for cl in _memory_calls.values():
            if company_id and cl.get("company_id") != company_id:
                continue
            if outcome and cl.get("call_outcome") != outcome:
                continue
            comp = _memory_companies.get(cl.get("company_id"))
            c_name = comp["company_name"] if comp else "Unknown Company"
            enriched = _enrich_call(cl, c_name)
            if overdue_only and not enriched.is_overdue:
                continue
            res.append(enriched)
        res.sort(key=lambda x: x.call_date, reverse=True)
        return res

    def create_call(self, data: CallRecordCreate) -> CallRecordOut:
        now = datetime.now(timezone.utc)
        new_id = str(uuid.uuid4())
        call_dt = data.call_date or now
        record = {
            "id": new_id,
            "company_id": data.company_id,
            "contact_name": data.contact_name,
            "call_date": call_dt.isoformat() if isinstance(call_dt, datetime) else call_dt,
            "notes": data.notes,
            "call_outcome": data.call_outcome.value,
            "follow_up_date": data.follow_up_date.isoformat() if data.follow_up_date else None,
            "ai_preparation": data.ai_preparation,
            "created_at": now.isoformat(),
        }

        comp = self.get_company(data.company_id)
        comp_name = comp.company_name if comp else None

        sb = _get_supabase_client()
        if sb:
            try:
                res = sb.table("call_records").insert(record).execute()
                if res.data:
                    return _enrich_call(res.data[0], comp_name)
            except Exception as e:
                logger.error(f"Supabase create_call error: {e}")

        _memory_calls[new_id] = record
        return _enrich_call(record, comp_name)

    def update_call(self, call_id: str, data: CallRecordUpdate) -> Optional[CallRecordOut]:
        update_dict = {}
        dump = data.model_dump()
        for k, v in dump.items():
            if v is not None:
                if isinstance(v, datetime):
                    update_dict[k] = v.isoformat()
                elif isinstance(v, CallOutcome):
                    update_dict[k] = v.value
                else:
                    update_dict[k] = v

        if not update_dict:
            return self.get_call(call_id)

        sb = _get_supabase_client()
        if sb:
            try:
                res = sb.table("call_records").update(update_dict).eq("id", call_id).execute()
                if res.data:
                    comp_id = res.data[0].get("company_id")
                    comp = self.get_company(comp_id) if comp_id else None
                    return _enrich_call(res.data[0], comp.company_name if comp else None)
            except Exception as e:
                logger.error(f"Supabase update_call error: {e}")

        if call_id in _memory_calls:
            _memory_calls[call_id].update(update_dict)
            comp_id = _memory_calls[call_id].get("company_id")
            comp = self.get_company(comp_id) if comp_id else None
            return _enrich_call(_memory_calls[call_id], comp.company_name if comp else None)
        return None

    def get_call(self, call_id: str) -> Optional[CallRecordOut]:
        sb = _get_supabase_client()
        if sb:
            try:
                res = sb.table("call_records").select("*, companies(company_name)").eq("id", call_id).execute()
                if res.data:
                    row = res.data[0]
                    comp_name = None
                    if "companies" in row and isinstance(row["companies"], dict):
                        comp_name = row["companies"].get("company_name")
                    return _enrich_call(row, comp_name)
            except Exception as e:
                logger.error(f"Supabase get_call error: {e}")

        if call_id in _memory_calls:
            cl = _memory_calls[call_id]
            comp = self.get_company(cl.get("company_id"))
            return _enrich_call(cl, comp.company_name if comp else None)
        return None

    def delete_call(self, call_id: str) -> bool:
        sb = _get_supabase_client()
        if sb:
            try:
                sb.table("call_records").delete().eq("id", call_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase delete_call error: {e}")

        if call_id in _memory_calls:
            del _memory_calls[call_id]
            return True
        return False

    def get_follow_ups(self) -> Dict[str, Any]:
        """Returns pending follow-ups partitioned into overdue and upcoming."""
        all_calls = self.list_calls()
        now = datetime.now(timezone.utc)
        overdue = []
        upcoming = []

        for call in all_calls:
            if call.call_outcome in [CallOutcome.FOLLOW_UP_REQUIRED, CallOutcome.INTERESTED] and call.follow_up_date:
                if call.follow_up_date < now:
                    overdue.append(call)
                else:
                    upcoming.append(call)

        upcoming.sort(key=lambda x: x.follow_up_date or now)
        overdue.sort(key=lambda x: x.follow_up_date or now)
        return {
            "total_pending": len(overdue) + len(upcoming),
            "overdue_count": len(overdue),
            "upcoming_count": len(upcoming),
            "overdue": overdue,
            "upcoming": upcoming,
        }

    def reset_and_seed(self) -> Dict[str, Any]:
        global _memory_companies, _memory_calls
        _memory_companies.clear()
        _memory_calls.clear()
        self._seed_in_memory()
        return {
            "message": "Demo sample data refreshed successfully.",
            "companies_count": len(_memory_companies),
            "calls_count": len(_memory_calls),
        }

db = DatabaseService()
