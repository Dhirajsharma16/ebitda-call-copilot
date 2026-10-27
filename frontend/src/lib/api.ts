import { Company, CallRecord, EBITDACalculationResponse, AICallPrep, HealthStatus, FollowUpSummary, FollowUpEmailResponse, CompanyResearchResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const api = {
  async getHealth(): Promise<HealthStatus | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/health`, { method: 'GET' }, 3000);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getCompanies(search?: string): Promise<Company[]> {
    const url = new URL(`${API_BASE_URL}/api/companies`);
    if (search) url.searchParams.set('search', search);

    try {
      const res = await fetchWithTimeout(url.toString(), { method: 'GET' }, 5000);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      // Local storage fallback for standalone preview
      return getLocalCompanies(search);
    }
  },

  async getCompany(id: string): Promise<{ company: Company; calls: CallRecord[] }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/companies/${id}`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const company = getLocalCompanies().find(c => c.id === id);
      if (!company) throw new Error('Company not found');
      const calls = getLocalCalls().filter(c => c.company_id === id);
      return { company, calls };
    }
  },

  async createCompany(payload: Partial<Company>): Promise<Company> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to create company (${res.status})`);
      }
      return await res.json();
    } catch (e: any) {
      if (typeof window !== 'undefined') {
        const local = saveLocalCompany(payload);
        return local;
      }
      throw e;
    }
  },

  async updateCompany(id: string, payload: Partial<Company>): Promise<Company> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      return updateLocalCompany(id, payload);
    }
  },

  async deleteCompany(id: string): Promise<void> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/companies/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch {
      deleteLocalCompany(id);
    }
  },

  async calculateEBITDA(params: {
    revenue: number;
    operating_expenses: number;
    interest?: number;
    taxes?: number;
    depreciation?: number;
    amortization?: number;
    hypothetical_revenue_change_pct?: number;
    hypothetical_cost_reduction_pct?: number;
  }): Promise<EBITDACalculationResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/calculator/ebitda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Calculation service unavailable');
      return await res.json();
    } catch {
      // Local client calculation fallback
      return calculateLocalEBITDA(params);
    }
  },

  async prepareAICall(payload: {
    company_id?: string;
    company_name: string;
    industry?: string | null;
    location?: string | null;
    contact_name?: string | null;
    contact_designation?: string | null;
    business_challenges?: string | null;
    revenue?: number;
    operating_expenses?: number;
    ebitda?: number;
    ebitda_margin_pct?: number;
  }): Promise<AICallPrep> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/ai/prepare-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 25000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `AI call prep failed (${res.status})`);
      }
      return await res.json();
    } catch (e: any) {
      return generateLocalAICallPrep(payload, e.message);
    }
  },

  async getCalls(companyId?: string, outcome?: string, overdueOnly = false): Promise<CallRecord[]> {
    const url = new URL(`${API_BASE_URL}/api/calls`);
    if (companyId) url.searchParams.set('company_id', companyId);
    if (outcome) url.searchParams.set('outcome', outcome);
    if (overdueOnly) url.searchParams.set('overdue_only', 'true');

    try {
      const res = await fetchWithTimeout(url.toString(), { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      return getLocalCalls(companyId, outcome, overdueOnly);
    }
  },

  async createCall(payload: {
    company_id: string;
    contact_name?: string | null;
    call_date?: string;
    notes?: string | null;
    call_outcome: string;
    follow_up_date?: string | null;
    ai_preparation?: any;
  }): Promise<CallRecord> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to record call (${res.status})`);
      }
      return await res.json();
    } catch {
      return saveLocalCall(payload);
    }
  },

  async updateCall(id: string, payload: Partial<CallRecord>): Promise<CallRecord> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/calls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      return updateLocalCall(id, payload);
    }
  },

  async deleteCall(id: string): Promise<void> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/calls/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    } catch {
      deleteLocalCall(id);
    }
  },

  async getFollowUps(): Promise<FollowUpSummary> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/follow-ups`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      const calls = getLocalCalls();
      const now = new Date();
      const overdue: CallRecord[] = [];
      const upcoming: CallRecord[] = [];

      for (const call of calls) {
        if (['Follow-up Required', 'Interested'].includes(call.call_outcome) && call.follow_up_date) {
          const fDate = new Date(call.follow_up_date);
          if (fDate < now) {
            overdue.push({ ...call, is_overdue: true });
          } else {
            upcoming.push(call);
          }
        }
      }

      return {
        total_pending: overdue.length + upcoming.length,
        overdue_count: overdue.length,
        upcoming_count: upcoming.length,
        overdue,
        upcoming,
      };
    }
  },

  async generateFollowUpEmail(payload: {
    company_name: string;
    contact_name?: string | null;
    contact_designation?: string | null;
    notes?: string | null;
    ebitda?: number;
    ebitda_margin_pct?: number;
    follow_up_date?: string | null;
  }): Promise<FollowUpEmailResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/ai/follow-up-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 15000);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    const contact = payload.contact_name || 'there';
    return {
      subject: `Next steps: Operating efficiency & margin discussion for ${payload.company_name}`,
      body: `Hi ${contact},\n\nThank you for taking a few moments to speak with me today regarding ${payload.company_name}'s operational priorities.\n\nKey takeaways from our brief discussion:\n• Focus on safeguarding operating margins against current overhead headwinds.\n• Reviewing how targeted process telemetry detects cost leakage across workflows.\n\nAs agreed, I look forward to connecting with you on ${payload.follow_up_date || 'next week'} for a brief 15-minute executive review.\n\nBest regards,\nExecutive Business Development`,
      model_used: 'executive-synthesis-engine'
    };
  },

  async researchCompany(payload: {
    company_name: string;
    industry?: string | null;
  }): Promise<CompanyResearchResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/ai/research-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 15000);
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return {
      success: true,
      data: {
        business_challenges: `Operational overhead, supply chain latency, and labor cost escalation across ${payload.industry || 'primary operational facilities'}.`,
        typical_ebitda_margin_range: '12% - 18%',
        executive_hook: `Protecting operational margins against rising overhead and process friction.`
      },
      model: 'synthesis-engine'
    };
  },

  async seedDemo(): Promise<{ message: string }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/seed`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    resetLocalDemoData();
    return { message: 'Sample demo data seeded in local store.' };
  }
};

// -------------------------------------------------------------
// CLIENT-SIDE FALLBACK STORAGE HELPERS (Guarantees zero downtime)
// -------------------------------------------------------------

const DEFAULT_SAMPLE_COMPANIES: Company[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    company_name: 'RapidRoute Trucking & Fleet',
    website: 'https://rapidroute-fleet.example.com',
    industry: 'Transportation & Logistics',
    location: 'Dallas, TX, USA',
    contact_name: 'John Miller',
    contact_designation: 'Chief Executive Officer',
    business_challenges: 'Diesel fuel and truck maintenance consume 92% of all revenue. Operating at a tight 8% EBITDA margin where any fuel price hike wipes out net profit.',
    revenue: 50000000,
    operating_expenses: 46000000,
    ebitda: 4000000,
    ebitda_margin_pct: 8.0,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    company_name: 'CloudSync Software',
    website: 'https://cloudsync-software.example.com',
    industry: 'Enterprise Software / SaaS',
    location: 'Boston, MA, USA',
    contact_name: 'David Chen',
    contact_designation: 'VP of Sales & Operations',
    business_challenges: 'AWS cloud server hosting costs jumped 25% YoY, threatening their 30% EBITDA margin target before the upcoming investor funding round.',
    revenue: 20000000,
    operating_expenses: 14000000,
    ebitda: 6000000,
    ebitda_margin_pct: 30.0,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    company_name: 'GreenBean Coffee Cafes',
    website: 'https://greenbean-cafes.example.com',
    industry: 'Retail & Food Chain',
    location: 'Chicago, IL, USA',
    contact_name: 'Sarah Adams',
    contact_designation: 'Chief Operating Officer',
    business_challenges: 'Perishable dairy and coffee bean waste across 40 regional cafes is leaking $500,000/year, keeping their EBITDA margin compressed at 15%.',
    revenue: 15000000,
    operating_expenses: 12750000,
    ebitda: 2250000,
    ebitda_margin_pct: 15.0,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    company_name: 'Precision Metal Parts',
    website: 'https://precision-metalparts.example.com',
    industry: 'Manufacturing',
    location: 'Cleveland, OH, USA',
    contact_name: 'Elena Rostova',
    contact_designation: 'Managing Director',
    business_challenges: 'CNC machine scrap rate at 4.8% is wasting $1.2M in raw aluminum and steel. Looking to optimize production efficiency to protect a 20% margin.',
    revenue: 30000000,
    operating_expenses: 24000000,
    ebitda: 6000000,
    ebitda_margin_pct: 20.0,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    company_name: 'MetroHealth Medical Centers',
    website: 'https://metrohealth-centers.example.com',
    industry: 'Healthcare Services',
    location: 'Atlanta, GA, USA',
    contact_name: 'Dr. Robert Sterling',
    contact_designation: 'Executive Managing Director',
    business_challenges: 'Manual insurance billing paperwork errors cause 45-day reimbursement delays and tie up $3.5M in clinic cash flow.',
    revenue: 40000000,
    operating_expenses: 30000000,
    ebitda: 10000000,
    ebitda_margin_pct: 25.0,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  }
];

const DEFAULT_SAMPLE_CALLS: CallRecord[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    company_id: 'a1111111-1111-1111-1111-111111111111',
    company_name: 'RapidRoute Trucking & Fleet',
    contact_name: 'John Miller',
    call_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: 'Spoke with CEO John. He said diesel fuel costs are eating 92% of their sales. He agreed that cutting fuel waste by 3% saves them $1.3M straight to EBITDA. Promised to send a 1-page breakdown and call him back Tuesday at 10 AM.',
    call_outcome: 'Follow-up Required',
    follow_up_date: new Date(Date.now() - 86400000).toISOString(), // Overdue
    ai_preparation: {
      opening_line: 'John, noticed RapidRoute expanded interstate delivery fleets—curious how you are safeguarding your 8% operating margin against diesel spikes.',
      discovery_questions: [
        'What is your single biggest cost driver on fuel?',
        'How quickly does dispatch identify route margin decay?'
      ]
    },
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_overdue: true,
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    company_id: 'c3333333-3333-3333-3333-333333333333',
    company_name: 'GreenBean Coffee Cafes',
    contact_name: 'Sarah Adams',
    call_date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Sarah confirmed cafe milk and food waste is costing them $500k/yr before their board meeting. Scheduled a 15-minute live demo on Thursday at 2 PM.',
    call_outcome: 'Interested',
    follow_up_date: new Date(Date.now() + 3 * 86400000).toISOString(),
    ai_preparation: {
      opening_line: 'Sarah, reaching out because food chains we advise cut perishables waste by 18% to protect their 15% EBITDA margin.',
      discovery_questions: ['How much does store-level perishables waste impact your bottom line?']
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_overdue: false,
  },
  {
    id: 'f3333333-3333-3333-3333-333333333333',
    company_id: 'b2222222-2222-2222-2222-222222222222',
    company_name: 'CloudSync Software',
    contact_name: 'David Chen',
    call_date: new Date(Date.now() - 4 * 86400000).toISOString(),
    notes: 'Executive assistant answered; David was in an investor review. Left voicemail referencing how SaaS peers cut AWS server costs by 18% to protect their 30% margin.',
    call_outcome: 'No Answer',
    follow_up_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    is_overdue: false,
  },
  {
    id: 'f4444444-4444-4444-4444-444444444444',
    company_id: 'd4444444-4444-4444-4444-444444444444',
    company_name: 'Precision Metal Parts',
    contact_name: 'Elena Rostova',
    call_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: 'Elena wants her head of factory operations on the call. Re-scheduled for next Monday to review machine defect inspection data.',
    call_outcome: 'Follow-up Required',
    follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    is_overdue: false,
  }
];

function getLocalCompanies(search?: string): Company[] {
  if (typeof window === 'undefined') return DEFAULT_SAMPLE_COMPANIES;
  const raw = localStorage.getItem('ebitda_copilot_companies');
  let list: Company[] = DEFAULT_SAMPLE_COMPANIES;
  if (!raw || raw.includes('Apex Industrial Logistics Corp')) {
    localStorage.setItem('ebitda_copilot_companies', JSON.stringify(DEFAULT_SAMPLE_COMPANIES));
    list = DEFAULT_SAMPLE_COMPANIES;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = DEFAULT_SAMPLE_COMPANIES;
    }
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(c => c.company_name.toLowerCase().includes(s) || (c.industry && c.industry.toLowerCase().includes(s)));
  }
  return list;
}

function saveLocalCompany(data: Partial<Company>): Company {
  const list = getLocalCompanies();
  const rev = Number(data.revenue || 0);
  const opex = Number(data.operating_expenses || 0);
  const ebitda = rev - opex;
  const margin = rev > 0 ? (ebitda / rev) * 100 : 0;

  const newComp: Company = {
    id: 'comp_' + Math.random().toString(36).substring(2, 10),
    company_name: data.company_name || 'Unnamed Company',
    website: data.website || null,
    industry: data.industry || null,
    location: data.location || null,
    contact_name: data.contact_name || null,
    contact_designation: data.contact_designation || null,
    business_challenges: data.business_challenges || null,
    revenue: rev,
    operating_expenses: opex,
    ebitda: Math.round(ebitda * 100) / 100,
    ebitda_margin_pct: Math.round(margin * 100) / 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  list.unshift(newComp);
  localStorage.setItem('ebitda_copilot_companies', JSON.stringify(list));
  return newComp;
}

function updateLocalCompany(id: string, data: Partial<Company>): Company {
  const list = getLocalCompanies();
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Company not found');

  const rev = data.revenue !== undefined ? Number(data.revenue) : list[idx].revenue;
  const opex = data.operating_expenses !== undefined ? Number(data.operating_expenses) : list[idx].operating_expenses;
  const ebitda = rev - opex;
  const margin = rev > 0 ? (ebitda / rev) * 100 : 0;

  list[idx] = {
    ...list[idx],
    ...data,
    revenue: rev,
    operating_expenses: opex,
    ebitda: Math.round(ebitda * 100) / 100,
    ebitda_margin_pct: Math.round(margin * 100) / 100,
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem('ebitda_copilot_companies', JSON.stringify(list));
  return list[idx];
}

function deleteLocalCompany(id: string) {
  let list = getLocalCompanies();
  list = list.filter(c => c.id !== id);
  localStorage.setItem('ebitda_copilot_companies', JSON.stringify(list));
}

function getLocalCalls(companyId?: string, outcome?: string, overdueOnly?: boolean): CallRecord[] {
  if (typeof window === 'undefined') return DEFAULT_SAMPLE_CALLS;
  const raw = localStorage.getItem('ebitda_copilot_calls');
  let list: CallRecord[] = DEFAULT_SAMPLE_CALLS;
  if (!raw || raw.includes('Apex Industrial')) {
    localStorage.setItem('ebitda_copilot_calls', JSON.stringify(DEFAULT_SAMPLE_CALLS));
    list = DEFAULT_SAMPLE_CALLS;
  } else {
    try {
      list = JSON.parse(raw);
    } catch {
      list = DEFAULT_SAMPLE_CALLS;
    }
  }

  const now = new Date();
  list = list.map(c => ({
    ...c,
    is_overdue: Boolean(c.follow_up_date && new Date(c.follow_up_date) < now && ['Follow-up Required', 'Interested'].includes(c.call_outcome)),
  }));

  if (companyId) list = list.filter(c => c.company_id === companyId);
  if (outcome) list = list.filter(c => c.call_outcome === outcome);
  if (overdueOnly) list = list.filter(c => c.is_overdue);

  return list;
}

function saveLocalCall(data: any): CallRecord {
  const list = getLocalCalls();
  const companies = getLocalCompanies();
  const comp = companies.find(c => c.id === data.company_id);

  const newCall: CallRecord = {
    id: 'call_' + Math.random().toString(36).substring(2, 10),
    company_id: data.company_id,
    company_name: comp ? comp.company_name : 'Unknown Company',
    contact_name: data.contact_name || (comp ? comp.contact_name : null),
    call_date: data.call_date || new Date().toISOString(),
    notes: data.notes || '',
    call_outcome: data.call_outcome,
    follow_up_date: data.follow_up_date || null,
    ai_preparation: data.ai_preparation || null,
    created_at: new Date().toISOString(),
  };

  list.unshift(newCall);
  localStorage.setItem('ebitda_copilot_calls', JSON.stringify(list));
  return newCall;
}

function updateLocalCall(id: string, data: Partial<CallRecord>): CallRecord {
  const list = getLocalCalls();
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) throw new Error('Call record not found');
  list[idx] = { ...list[idx], ...data };
  localStorage.setItem('ebitda_copilot_calls', JSON.stringify(list));
  return list[idx];
}

function deleteLocalCall(id: string) {
  let list = getLocalCalls();
  list = list.filter(c => c.id !== id);
  localStorage.setItem('ebitda_copilot_calls', JSON.stringify(list));
}

function resetLocalDemoData() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ebitda_copilot_companies', JSON.stringify(DEFAULT_SAMPLE_COMPANIES));
    localStorage.setItem('ebitda_copilot_calls', JSON.stringify(DEFAULT_SAMPLE_CALLS));
  }
}

function calculateLocalEBITDA(params: any): EBITDACalculationResponse {
  const rev = Number(params.revenue || 0);
  const opex = Number(params.operating_expenses || 0);
  const interest = Number(params.interest || 0);
  const taxes = Number(params.taxes || 0);
  const dep = Number(params.depreciation || 0);
  const amort = Number(params.amortization || 0);

  const ebitda = rev - opex;
  const margin = rev > 0 ? (ebitda / rev) * 100 : 0;

  let classification = 'Compressed (<8%)';
  if (ebitda < 0) classification = 'Negative Margin';
  else if (margin >= 25) classification = 'High (>25%)';
  else if (margin >= 15) classification = 'Healthy (15-25%)';
  else if (margin >= 8) classification = 'Moderate (8-15%)';

  const revChangePct = Number(params.hypothetical_revenue_change_pct || 0);
  const costReductPct = Number(params.hypothetical_cost_reduction_pct || 0);

  const projRev = rev * (1 + revChangePct / 100);
  const projOpex = Math.max(0, opex * (1 - costReductPct / 100));
  const projEbitda = projRev - projOpex;
  const projMargin = projRev > 0 ? (projEbitda / projRev) * 100 : 0;

  return {
    revenue: rev,
    operating_expenses: opex,
    interest,
    taxes,
    depreciation: dep,
    amortization: amort,
    d_and_a_total: dep + amort,
    ebitda: Math.round(ebitda * 100) / 100,
    ebitda_margin_pct: Math.round(margin * 100) / 100,
    margin_classification: classification,
    scenario: {
      projected_revenue: Math.round(projRev * 100) / 100,
      projected_operating_expenses: Math.round(projOpex * 100) / 100,
      projected_ebitda: Math.round(projEbitda * 100) / 100,
      projected_ebitda_margin_pct: Math.round(projMargin * 100) / 100,
      ebitda_delta: Math.round((projEbitda - ebitda) * 100) / 100,
      margin_delta_pct: Math.round((projMargin - margin) * 100) / 100,
      revenue_change_applied_pct: revChangePct,
      cost_reduction_applied_pct: costReductPct,
      disclaimer: 'Hypothetical Scenario — For illustrative sales discussion purposes only. Does not promise specific business outcomes or savings.',
    }
  };
}

function generateLocalAICallPrep(data: any, reason?: string): AICallPrep {
  const name = data.company_name || 'the company';
  const contact = data.contact_name || 'there';
  const title = data.contact_designation || 'Executive';
  const industry = data.industry || 'General Business';
  const challenges = data.business_challenges || 'operational friction and margin preservation';

  return {
    company_name: name,
    opening_line: `Hi ${contact}, I know you're leading ${industry.toLowerCase()} operations at ${name}. I'm reaching out because several peers in your space have been actively protecting operating margins against cost pressures—curious how that is tracking for you this quarter.`,
    discovery_questions: [
      `As ${title} at ${name}, what is the top operational or cost hurdle your executive team is prioritizing right now?`,
      `When dealing with challenges like ${challenges.slice(0, 70)}, how quickly does your leadership team spot margin decay?`,
      `If you could eliminate one manual or fragmented bottleneck in your workflow, what would free up the most operating margin?`,
      `How do rising operating costs currently factor into your quarterly board discussions?`
    ],
    financial_efficiency_questions: [
      `With typical ${industry} EBITDA margins, how sensitive is your operating model to a 2-3% increase in overhead costs?`,
      `Are your efficiency targets focused on immediate vendor consolidation or long-term operational automation?`,
      `How frequently is your financial leadership reviewing OpEx variance across teams?`
    ],
    objections_and_rebuttals: [
      {
        objection: 'We already have legacy software and internal teams handling this.',
        rebuttal: 'Completely understand—we never recommend replacing core tools. We focus solely on closing the data gaps where margin leakage silently occurs between existing systems.'
      },
      {
        objection: 'We have a frozen budget and no appetite for new vendor commitments.',
        rebuttal: 'That makes total sense in today\'s climate. This conversation isn\'t about purchasing anything today; it\'s about sharing benchmarking data so you have options ready for next fiscal.'
      },
      {
        objection: 'Send me an email and I will take a look when I have time.',
        rebuttal: 'I respect how busy you are. Rather than generic collateral, if I put together a customized 1-page financial efficiency teardown for your specific challenges, would you have 10 minutes next Tuesday to review it?'
      }
    ],
    ai_problem_solving: `By applying targeted AI automation and diagnostic models to operational data logs, ${name} can continuously detect anomalies and cost overruns tied to ${challenges.slice(0, 80)}, preventing margin decay before quarter-end.`,
    closing_line: `${contact}, I know your calendar is tight. Would you be open to a 15-minute introductory conversation next Tuesday or Thursday to see if our findings align with your current roadmap?`,
    missing_data_notes: [
      !data.revenue ? 'Revenue figure not provided' : null,
      !data.contact_name ? 'Direct prospect name not provided' : null,
      !data.business_challenges ? 'Specific operational bottlenecks not specified' : null
    ].filter(Boolean) as string[],
    model_used: 'rule-based-synthesis-engine',
    is_simulated: true,
    warning_or_notice: reason || 'Backend offline or GROQ_API_KEY unconfigured. Generated tailored strategy via client synthesis engine.'
  };
}
