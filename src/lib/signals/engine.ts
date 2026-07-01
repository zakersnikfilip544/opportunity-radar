import { fetchFeed, type FetchedArticle } from "./fetch";
import { SLOVENIAN_RSS_SOURCES } from "./sources";
import { detectSignal, computeUrgency } from "./keywords";
import { MASTER_KEYWORD_RULES, getProfile, profileMatches, type ProfileId } from "./profiles";
import { evaluateArticle, extractMunicipality, extractIndustry, extractCompanyEntity, type IntentEvaluation } from "./intent";
import { deduplicateOpportunities } from "./dedupe";
import { deriveSalesAngle, deriveBestTimeToContact, slugify } from "@/lib/utils/helpers";
import type { Opportunity } from "@/types";

const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes — avoid hammering public feeds
const MAX_RESULTS = 30;

interface CacheEntry {
  opportunities: Opportunity[];
  fetchedAt: string;
}

let cache: CacheEntry | null = null;
let inFlight: Promise<CacheEntry> | null = null;

function articleText(article: FetchedArticle): string {
  return `${article.title} ${article.content ?? ""}`;
}

function toOpportunity(article: FetchedArticle, sourceName: string, evaluation: IntentEvaluation): Opportunity {
  // Separate pass over the profile-specific keyword vocabularies (Plan B /
  // KONEKT / Besolar) — orthogonal to the Business Intent Layer, only used
  // so the existing profile selector keeps filtering correctly on top of
  // this now much smaller, much higher-quality pool. It can never lower the
  // acceptance bar: it only ever runs on articles that already passed
  // evaluateArticle().
  const text = articleText(article);
  const profileSignal = detectSignal(text, MASTER_KEYWORD_RULES);
  const matchedKeywords = [...new Set([
    ...evaluation.matchedPositive.map((c) => c.concept),
    ...(profileSignal?.matchedKeywords ?? []),
  ])];

  const now = new Date().toISOString();
  const publishedAt = article.published_at ?? now;
  const urgency = computeUrgency(publishedAt, evaluation.matchedPositive.length);
  const company = extractCompanyEntity(text, evaluation.type);
  const municipality = extractMunicipality(text);
  const industry = extractIndustry(text);

  const opp: Opportunity = {
    id: `live-${slugify(article.url).slice(0, 80)}`,
    title: article.title,
    summary: (article.content || article.title).slice(0, 400),
    type: evaluation.type,
    urgency,
    // opportunity_score = Business Intent Score, sales_potential = Commercial
    // Potential, confidence_score = Buying Probability — the three Business
    // Intent Layer scores, mapped onto the existing (previously-unused)
    // fields the UI already renders as score rings, no layout changes needed.
    opportunity_score: evaluation.businessIntentScore,
    sales_potential: evaluation.commercialPotential,
    confidence_score: evaluation.buyingProbability,
    country: "Slovenia",
    city: municipality ?? undefined,
    industry: industry ?? undefined,
    estimated_value_currency: "EUR",
    source_url: article.url,
    source_name: sourceName,
    why_it_matters: evaluation.whyItMatters,
    suggested_action: evaluation.recommendedAction,
    opportunity_reason: evaluation.reasonLabel,
    tags: matchedKeywords,
    matched_keywords: matchedKeywords,
    is_live: true,
    is_featured: false,
    is_verified: true,
    view_count: 0,
    published_at: publishedAt,
    created_at: now,
    updated_at: now,
  };

  opp.sales_angle = deriveSalesAngle(opp);
  opp.best_time_to_contact = deriveBestTimeToContact(opp);

  if (company) {
    const slug = slugify(company.name);
    opp.company_id = `live-co-${slug}`;
    opp.company = {
      id: `live-co-${slug}`,
      name: company.name,
      slug,
      country: "Slovenia",
      city: municipality ?? undefined,
      industry: industry ?? undefined,
      tags: [],
      metadata: {},
      created_at: now,
      updated_at: now,
    };
  }

  return opp;
}

async function fetchFreshSignals(): Promise<CacheEntry> {
  const results = await Promise.allSettled(
    SLOVENIAN_RSS_SOURCES.map((source) =>
      fetchFeed(source.feedUrl).then((articles) => ({ source, articles }))
    )
  );

  const seenUrls = new Set<string>();
  const candidates: Opportunity[] = [];
  let fetchedCount = 0;
  let rejectedNonBusiness = 0;
  let rejectedLowValue = 0;

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { source, articles } = result.value;
    for (const article of articles) {
      if (!article.url || !article.title || seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);
      fetchedCount++;

      const outcome = evaluateArticle(articleText(article), article.published_at);
      if (!outcome.accepted) {
        if (outcome.rejectionReason === "non_business") rejectedNonBusiness++;
        else rejectedLowValue++;
        continue;
      }

      candidates.push(toOpportunity(article, source.name, outcome.accepted));
    }
  }

  candidates.sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0));

  const { deduped, duplicatesRemoved } = deduplicateOpportunities(candidates);
  const finalOpportunities = deduped.slice(0, MAX_RESULTS);

  const accepted = candidates.length;
  const acceptanceRate = fetchedCount ? Math.round((accepted / fetchedCount) * 100) : 0;

  // Developer Quality Report — not user-facing, just for debugging the
  // Business Intent Layer's acceptance behavior.
  console.log(
    `[SignalEngine] Quality Report — Fetched: ${fetchedCount} | ` +
    `Rejected as non-business: ${rejectedNonBusiness} | ` +
    `Rejected as low commercial value: ${rejectedLowValue} | ` +
    `Accepted: ${accepted} | Acceptance rate: ${acceptanceRate}% | ` +
    `Duplicates removed: ${duplicatesRemoved} | Final opportunities: ${finalOpportunities.length}`
  );

  return {
    opportunities: finalOpportunities,
    fetchedAt: new Date().toISOString(),
  };
}

export interface LiveSignalsResult {
  opportunities: Opportunity[];
  fetchedAt: string;
  cached: boolean;
}

/**
 * Returns the full live Slovenian business-signal pool (all profiles
 * combined), using a 20-minute in-memory cache to avoid hammering the
 * public RSS feeds. Never throws — any per-source or total failure simply
 * results in an empty array; callers show an empty state, they do not fall
 * back to mock data silently.
 */
export async function getLiveSlovenianSignals(opts?: { force?: boolean }): Promise<LiveSignalsResult> {
  if (!opts?.force && cache && Date.now() - new Date(cache.fetchedAt).getTime() < CACHE_TTL_MS) {
    return { ...cache, cached: true };
  }

  if (inFlight) {
    const result = await inFlight;
    return { ...result, cached: true };
  }

  inFlight = fetchFreshSignals()
    .then((result) => {
      cache = result;
      return result;
    })
    .catch((error) => {
      console.error("[SignalEngine] Failed to fetch live Slovenian signals:", error);
      return { opportunities: [], fetchedAt: new Date().toISOString() };
    })
    .finally(() => {
      inFlight = null;
    });

  const result = await inFlight;
  return { ...result, cached: false };
}

/**
 * The live pool, filtered to one radar profile and with that profile's
 * sales-angle / recommended-action text applied (Splošno = no filter, no
 * override — the generic type-based text stays as-is).
 */
export async function getLiveSignalsForProfile(
  profileId: ProfileId | string | undefined,
  opts?: { force?: boolean }
): Promise<LiveSignalsResult> {
  const { opportunities, fetchedAt, cached } = await getLiveSlovenianSignals(opts);
  const profile = getProfile(profileId);

  const filtered = opportunities.filter((o) => profileMatches(profile, o.matched_keywords ?? []));

  if (profile.id === "splosno") {
    return { opportunities: filtered, fetchedAt, cached };
  }

  const branded = filtered.map((o) => ({
    ...o,
    sales_angle: profile.salesAngleText,
    suggested_action: profile.recommendedAction,
  }));

  return { opportunities: branded, fetchedAt, cached };
}

/**
 * Synchronous lookup into whatever is currently cached — used by the
 * opportunity detail route to resolve `live-*` ids without re-fetching.
 * Returns null if nothing is cached yet or the id isn't in it.
 */
export function getCachedLiveOpportunity(id: string): Opportunity | null {
  return cache?.opportunities.find((o) => o.id === id) ?? null;
}
