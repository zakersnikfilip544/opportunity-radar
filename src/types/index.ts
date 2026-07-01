// ============================================================
// ENUMS
// ============================================================

export type OpportunityType =
  | "funding"
  | "hiring"
  | "expansion"
  | "construction"
  | "government_tender"
  | "acquisition"
  | "investment"
  | "factory_expansion"
  | "new_product"
  | "technology_adoption"
  | "energy_project"
  | "digital_transformation"
  | "partnership"
  | "ipo"
  | "other";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type SourceType =
  | "rss"
  | "google_news"
  | "hacker_news"
  | "reddit"
  | "github_trending"
  | "product_hunt"
  | "eu_funding"
  | "government_tender"
  | "press_release"
  | "linkedin"
  | "crunchbase"
  | "ycombinator"
  | "manual";

// ============================================================
// CORE MODELS
// ============================================================

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  industry?: string;
  sub_industry?: string;
  country?: string;
  city?: string;
  founded_year?: number;
  employee_count_range?: string;
  website?: string;
  linkedin_url?: string;
  logo_url?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  feed_url?: string;
  country?: string;
  industry_focus?: string;
  language: string;
  is_active: boolean;
  last_scraped_at?: string;
  scrape_interval_minutes: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RawArticle {
  id: string;
  source_id: string;
  external_id?: string;
  title: string;
  content?: string;
  url: string;
  published_at?: string;
  author?: string;
  is_processed: boolean;
  processing_error?: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  summary: string;
  full_analysis?: string;

  // Classification
  type: OpportunityType;
  industry?: string;
  sub_type?: string;

  // Scores (0-100)
  opportunity_score?: number;
  growth_score?: number;
  sales_potential?: number;
  urgency_score?: number;
  competition_level?: number;
  confidence_score?: number;

  urgency: UrgencyLevel;

  // Geography
  country?: string;
  city?: string;
  region?: string;

  // Value
  estimated_value_min?: number;
  estimated_value_max?: number;
  estimated_value_currency: string;

  // Relations
  company_id?: string;
  company?: Company;
  raw_article_id?: string;
  source_url?: string;
  source_name?: string;

  // Live signal engine
  is_live?: boolean;
  matched_keywords?: string[];
  additional_sources?: { name: string; url: string }[];
  opportunity_reason?: string;

  // AI outputs
  why_it_matters?: string;
  potential_buyers?: string[];
  potential_sellers?: string[];
  suggested_action?: string;
  sales_angle?: string;
  best_time_to_contact?: string;
  cold_email?: string;
  linkedin_message?: string;
  target_roles?: string[];
  services_to_offer?: string[];

  tags: string[];

  is_featured: boolean;
  is_verified: boolean;
  view_count: number;

  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyEvent {
  id: string;
  company_id: string;
  opportunity_id?: string;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DailyDigest {
  id: string;
  digest_date: string;
  title: string;
  summary?: string;
  opportunity_ids: string[];
  opportunities?: Opportunity[];
  stats: DigestStats;
  generated_at: string;
  created_at: string;
}

export interface DigestStats {
  total_opportunities: number;
  by_type: Record<OpportunityType, number>;
  by_country: Record<string, number>;
  avg_opportunity_score: number;
  high_urgency_count: number;
  estimated_total_value?: number;
}

export type SavedStage = "saved" | "contacted" | "meeting" | "won" | "lost";

export interface SavedOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  opportunity?: Opportunity;
  notes?: string;
  tags: string[];
  stage?: SavedStage;
  created_at: string;
}

export interface ScrapeLog {
  id: string;
  source_id?: string;
  started_at: string;
  completed_at?: string;
  articles_found: number;
  articles_new: number;
  opportunities_created: number;
  error?: string;
  status: "running" | "completed" | "failed";
}

// ============================================================
// AI ANALYSIS
// ============================================================

export interface AIAnalysisResult {
  title: string;
  summary: string;
  full_analysis: string;
  type: OpportunityType;
  industry?: string;
  sub_type?: string;

  opportunity_score: number;
  growth_score: number;
  sales_potential: number;
  urgency_score: number;
  competition_level: number;
  confidence_score: number;
  urgency: UrgencyLevel;

  country?: string;
  city?: string;
  region?: string;

  company_name?: string;
  company_domain?: string;
  company_industry?: string;

  estimated_value_min?: number;
  estimated_value_max?: number;
  estimated_value_currency?: string;

  why_it_matters: string;
  potential_buyers: string[];
  potential_sellers: string[];
  suggested_action: string;
  cold_email: string;
  linkedin_message: string;
  target_roles: string[];
  services_to_offer: string[];

  tags: string[];
  is_opportunity: boolean;
}

// ============================================================
// API TYPES
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface OpportunityFilters {
  type?: OpportunityType[];
  country?: string[];
  industry?: string[];
  urgency?: UrgencyLevel[];
  min_score?: number;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: "published_at" | "opportunity_score" | "urgency_score" | "sales_potential";
  sort_order?: "asc" | "desc";
}

export interface DashboardStats {
  total_opportunities: number;
  today_opportunities: number;
  high_urgency: number;
  avg_score: number;
  by_type: Array<{ type: OpportunityType; count: number }>;
  by_country: Array<{ country: string; count: number }>;
  timeline: Array<{ date: string; count: number }>;
  top_industries: Array<{ industry: string; count: number }>;
}

// ============================================================
// OPPORTUNITY TYPE CONFIG
// ============================================================

export const OPPORTUNITY_TYPE_CONFIG: Record<
  OpportunityType,
  { label: string; color: string; icon: string }
> = {
  funding: { label: "Financiranje", color: "bg-violet-500/20 text-violet-300 border-violet-500/30", icon: "💰" },
  hiring: { label: "Zaposlovanje", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: "👥" },
  expansion: { label: "Širitev", color: "bg-green-500/20 text-green-300 border-green-500/30", icon: "📈" },
  construction: { label: "Gradnja", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: "🏗️" },
  government_tender: { label: "Javni razpis", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: "🏛️" },
  acquisition: { label: "Prevzem", color: "bg-pink-500/20 text-pink-300 border-pink-500/30", icon: "🤝" },
  investment: { label: "Naložba", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: "📊" },
  factory_expansion: { label: "Širitev tovarne", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: "🏭" },
  new_product: { label: "Nov izdelek", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", icon: "🚀" },
  technology_adoption: { label: "Uvajanje tehnologije", color: "bg-teal-500/20 text-teal-300 border-teal-500/30", icon: "💻" },
  energy_project: { label: "Energetski projekt", color: "bg-lime-500/20 text-lime-300 border-lime-500/30", icon: "⚡" },
  digital_transformation: { label: "Digitalna preobrazba", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", icon: "🔄" },
  partnership: { label: "Partnerstvo", color: "bg-sky-500/20 text-sky-300 border-sky-500/30", icon: "🔗" },
  ipo: { label: "Prva javna ponudba", color: "bg-rose-500/20 text-rose-300 border-rose-500/30", icon: "📣" },
  other: { label: "Drugo", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30", icon: "📌" },
};

export const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string }> = {
  low: { label: "Nizka", color: "text-zinc-400" },
  medium: { label: "Srednja", color: "text-yellow-400" },
  high: { label: "Visoka", color: "text-orange-400" },
  critical: { label: "Kritična", color: "text-red-400" },
};

export const SAVED_STAGE_CONFIG: Record<SavedStage, { label: string; color: string }> = {
  saved: { label: "Shranjeno", color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  contacted: { label: "Kontaktirano", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  meeting: { label: "Sestanek", color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  won: { label: "Pridobljeno", color: "bg-green-500/15 text-green-300 border-green-500/30" },
  lost: { label: "Izgubljeno", color: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export const SAVED_STAGE_ORDER: SavedStage[] = ["saved", "contacted", "meeting", "won", "lost"];
