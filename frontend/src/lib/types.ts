export type CallOutcome = 'Interested' | 'Follow-up Required' | 'Not Interested' | 'No Answer';

export interface Company {
  id: string;
  company_name: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  contact_name?: string | null;
  contact_designation?: string | null;
  business_challenges?: string | null;
  revenue: number;
  operating_expenses: number;
  ebitda: number;
  ebitda_margin_pct: number;
  company_size?: string | null;
  products_services?: string | null;
  expansion_news?: string | null;
  source_urls?: string[];
  fit_score?: number | null;
  evidence_confidence?: string | null;
  discovery_angle?: string | null;
  research_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ObjectionRebuttal {
  objection: string;
  rebuttal: string;
}

export interface AICallPrep {
  company_name: string;
  opening_line: string;
  discovery_questions: string[];
  financial_efficiency_questions: string[];
  objections_and_rebuttals: ObjectionRebuttal[];
  ai_problem_solving: string;
  closing_line: string;
  missing_data_notes: string[];
  model_used: string;
  is_simulated: boolean;
  warning_or_notice?: string | null;
}

export interface CallRecord {
  id: string;
  company_id: string;
  company_name?: string | null;
  contact_name?: string | null;
  call_date: string;
  notes?: string | null;
  call_outcome: CallOutcome;
  follow_up_date?: string | null;
  ai_preparation?: AICallPrep | any;
  created_at: string;
  is_overdue?: boolean;
}

export interface EBITDAScenario {
  projected_revenue: number;
  projected_operating_expenses: number;
  projected_ebitda: number;
  projected_ebitda_margin_pct: number;
  ebitda_delta: number;
  margin_delta_pct: number;
  revenue_change_applied_pct: number;
  cost_reduction_applied_pct: number;
  disclaimer: string;
}

export interface EBITDACalculationResponse {
  revenue: number;
  operating_expenses: number;
  interest: number;
  taxes: number;
  depreciation: number;
  amortization: number;
  d_and_a_total: number;
  ebitda: number;
  ebitda_margin_pct: number;
  margin_classification: string;
  scenario?: EBITDAScenario;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  groq_configured: boolean;
  groq_model: string;
  database_mode: string;
  database_connected: boolean;
}

export interface FollowUpSummary {
  total_pending: number;
  overdue_count: number;
  upcoming_count: number;
  overdue: CallRecord[];
  upcoming: CallRecord[];
}

export interface FollowUpEmailResponse {
  subject: string;
  body: string;
  model_used: string;
}

export interface CompanyResearchResponse {
  success: boolean;
  data: {
    business_challenges: string;
    typical_ebitda_margin_range: string;
    executive_hook: string;
  };
  model: string;
}

// ---------------------------------------------------------
// AI Prospect Discovery Types
// ---------------------------------------------------------
export interface DiscoveredProspect {
  id?: string | null;
  company_name: string;
  website?: string | null;
  industry: string;
  location: string;
  products_services?: string | null;
  company_size?: string;
  revenue?: number | null;
  operating_expenses?: number | null;
  ebitda?: number | null;
  ebitda_margin_pct?: number | null;
  expansion_news?: string | null;
  source_urls?: string[];
  research_date?: string | null;
  contact_name?: string | null;
  contact_designation?: string | null;
  prospect_fit_score: number;
  fit_score_reason: string;
  evidence_confidence: 'High' | 'Medium' | 'Low' | string;
  potential_discovery_angle: string;
  research_summary: string;
  is_saved_in_accounts?: boolean;
  existing_account_id?: string | null;
}

export interface ProspectDiscoveryRequest {
  industry: string;
  geography: string;
  company_size?: string;
  limit?: number;
  additional_requirements?: string;
}

export interface ProspectDiscoveryResponse {
  success: boolean;
  industry: string;
  geography: string;
  total_found: number;
  prospects: DiscoveredProspect[];
  research_timestamp: string;
  search_grounding_used: boolean;
  provider_notice?: string | null;
}

export interface DiscoveryOptionsResponse {
  industries: string[];
  geography_presets: string[];
  company_sizes: string[];
  limit_options: number[];
}

export interface AddProspectTargetRequest {
  prospect: DiscoveredProspect;
  force_update?: boolean;
}

export interface AddProspectTargetResponse {
  success: boolean;
  already_exists: boolean;
  message: string;
  company_id: string;
  company: Company;
}
