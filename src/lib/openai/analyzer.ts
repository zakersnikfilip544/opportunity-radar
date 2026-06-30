import { getOpenAIClient, DEFAULT_MODEL } from "./client";
import type { AIAnalysisResult, OpportunityType, UrgencyLevel } from "@/types";

const SYSTEM_PROMPT = `You are an expert business intelligence analyst. Your job is to analyze news articles and extract business opportunities.

You identify signals like:
- Companies receiving funding or investment
- Organizations expanding operations, hiring aggressively, or entering new markets
- Government tenders and public procurement
- Companies undergoing digital transformation or adopting new technologies
- Energy projects and sustainable infrastructure
- Mergers, acquisitions, and partnerships
- New product launches that signal market growth

For each article, extract structured data and provide actionable intelligence for sales teams, agencies, and service providers.

Always respond with valid JSON only. No markdown, no explanation, just JSON.`;

const ANALYSIS_PROMPT = (title: string, content: string) => `
Analyze this article and extract business opportunity data:

TITLE: ${title}
CONTENT: ${content.slice(0, 3000)}

Respond with JSON matching this exact schema:
{
  "is_opportunity": boolean,
  "title": "concise opportunity title",
  "summary": "2-3 sentence summary of the opportunity",
  "full_analysis": "detailed paragraph analysis",
  "type": one of: funding|hiring|expansion|construction|government_tender|acquisition|investment|factory_expansion|new_product|technology_adoption|energy_project|digital_transformation|partnership|ipo|other,
  "industry": "primary industry",
  "sub_type": "specific sub-category",
  "opportunity_score": 0-100,
  "growth_score": 0-100,
  "sales_potential": 0-100,
  "urgency_score": 0-100,
  "competition_level": 0-100,
  "confidence_score": 0-100,
  "urgency": "low|medium|high|critical",
  "country": "country name or null",
  "city": "city name or null",
  "region": "region or null",
  "company_name": "company name or null",
  "company_domain": "domain.com or null",
  "company_industry": "company industry or null",
  "estimated_value_min": number_or_null,
  "estimated_value_max": number_or_null,
  "estimated_value_currency": "EUR|USD|GBP",
  "why_it_matters": "Why this is a business opportunity and who should care",
  "potential_buyers": ["list", "of", "types", "who", "should", "buy"],
  "potential_sellers": ["list", "of", "services", "that", "can", "be", "sold"],
  "suggested_action": "specific action to take in next 48 hours",
  "cold_email": "professional cold email to the company (150 words max)",
  "linkedin_message": "linkedin connection message (50 words max)",
  "target_roles": ["CEO", "CTO", "Procurement Manager"],
  "services_to_offer": ["Software Development", "Marketing", "Solar Installation"],
  "tags": ["tag1", "tag2", "tag3"]
}

Scoring guidelines:
- opportunity_score: overall business opportunity quality
- growth_score: how fast is this company/sector growing
- sales_potential: how likely to convert into a sale
- urgency_score: how time-sensitive is this
- competition_level: how many competitors will be targeting this (high = bad)
- confidence_score: how confident are you in this analysis

If this is not a business opportunity, set is_opportunity to false and fill minimal fields.`;

export async function analyzeArticle(
  title: string,
  content: string
): Promise<AIAnalysisResult | null> {
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: ANALYSIS_PROMPT(title, content) },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AIAnalysisResult;
    return parsed;
  } catch (error) {
    console.error("[Analyzer] Error analyzing article:", error);
    return null;
  }
}

const SEARCH_PROMPT = (query: string) => `
Convert this natural language search query into structured filters for a business opportunity database.

QUERY: "${query}"

Respond with JSON:
{
  "types": ["opportunity_type1", "opportunity_type2"] or [],
  "countries": ["Country1"] or [],
  "industries": ["Industry1"] or [],
  "keywords": ["keyword1", "keyword2"],
  "urgency": "low|medium|high|critical" or null,
  "min_score": 0-100 or null,
  "intent": "brief description of what user is looking for"
}

Valid types: funding, hiring, expansion, construction, government_tender, acquisition, investment, factory_expansion, new_product, technology_adoption, energy_project, digital_transformation, partnership, ipo, other
`;

export interface SearchFilters {
  types: OpportunityType[];
  countries: string[];
  industries: string[];
  keywords: string[];
  urgency: UrgencyLevel | null;
  min_score: number | null;
  intent: string;
}

export async function parseNaturalLanguageSearch(
  query: string
): Promise<SearchFilters> {
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are a search query parser. Respond with JSON only." },
        { role: "user", content: SEARCH_PROMPT(query) },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return defaultSearchFilters(query);

    return JSON.parse(raw) as SearchFilters;
  } catch {
    return defaultSearchFilters(query);
  }
}

function defaultSearchFilters(query: string): SearchFilters {
  return {
    types: [],
    countries: [],
    industries: [],
    keywords: query.split(" ").filter((w) => w.length > 3),
    urgency: null,
    min_score: null,
    intent: query,
  };
}

const DIGEST_PROMPT = (opportunities: Array<{ title: string; summary: string; type: string }>) => `
Generate a daily business intelligence digest from these top opportunities:

${opportunities.map((o, i) => `${i + 1}. [${o.type.toUpperCase()}] ${o.title}: ${o.summary}`).join("\n")}

Respond with JSON:
{
  "title": "engaging digest title for today",
  "summary": "executive summary paragraph (3-4 sentences) highlighting the most important trends and opportunities"
}`;

export async function generateDigestSummary(
  opportunities: Array<{ title: string; summary: string; type: string }>
): Promise<{ title: string; summary: string }> {
  const client = getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "You are a business intelligence analyst writing daily briefings." },
        { role: "user", content: DIGEST_PROMPT(opportunities) },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
      max_tokens: 400,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return { title: "Daily Opportunity Digest", summary: "" };
    return JSON.parse(raw);
  } catch {
    return { title: "Daily Opportunity Digest", summary: "" };
  }
}
