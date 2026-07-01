import { scrapeRSSFeed, type ScrapedArticle } from "@/lib/scrapers/rss";
import { SLOVENIAN_RSS_SOURCES } from "./sources";
import {
  detectSignal,
  computeConfidenceScore,
  computeUrgency,
  extractCompanyName,
  RECOMMENDED_ACTION_SL,
} from "./keywords";
import { deriveSalesAngle, deriveBestTimeToContact, slugify } from "@/lib/utils/helpers";
import type { Opportunity, Source } from "@/types";

const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes — avoid hammering public feeds
const MAX_RESULTS = 12;

interface CacheEntry {
  opportunities: Opportunity[];
  fetchedAt: string;
}

let cache: CacheEntry | null = null;
let inFlight: Promise<CacheEntry> | null = null;

function sourceStub(name: string, feedUrl: string): Source {
  const now = new Date().toISOString();
  return {
    id: `sl-src-${slugify(name)}`,
    name,
    type: "rss",
    url: feedUrl,
    feed_url: feedUrl,
    country: "Slovenia",
    language: "sl",
    is_active: true,
    scrape_interval_minutes: 60,
    metadata: {},
    created_at: now,
  };
}

function articleText(article: ScrapedArticle): string {
  return `${article.title} ${article.content ?? ""}`;
}

function toOpportunity(article: ScrapedArticle, sourceName: string): Opportunity | null {
  if (!article.url || !article.title) return null;

  const signal = detectSignal(articleText(article));
  if (!signal) return null;

  const now = new Date().toISOString();
  const publishedAt = article.published_at ?? now;
  const confidence = computeConfidenceScore(signal.matchedKeywords.length, publishedAt);
  const urgency = computeUrgency(publishedAt, signal.matchedKeywords.length);
  const companyName = extractCompanyName(articleText(article));

  const opp: Opportunity = {
    id: `live-${slugify(article.url).slice(0, 80)}`,
    title: article.title,
    summary: (article.content || article.title).slice(0, 400),
    type: signal.type,
    urgency,
    opportunity_score: confidence,
    confidence_score: confidence,
    country: "Slovenia",
    estimated_value_currency: "EUR",
    source_url: article.url,
    source_name: sourceName,
    suggested_action: RECOMMENDED_ACTION_SL[signal.type],
    tags: signal.matchedKeywords,
    matched_keywords: signal.matchedKeywords,
    is_live: true,
    is_featured: false,
    is_verified: true,
    view_count: 0,
    published_at: publishedAt,
    created_at: now,
    updated_at: now,
  };

  // sales_angle / best_time_to_contact are populated lazily by the UI via
  // deriveSalesAngle()/deriveBestTimeToContact() fallbacks, but we compute
  // them here too so the live objects are fully self-describing.
  opp.sales_angle = deriveSalesAngle(opp);
  opp.best_time_to_contact = deriveBestTimeToContact(opp);

  if (companyName) {
    const slug = slugify(companyName);
    opp.company_id = `live-co-${slug}`;
    opp.company = {
      id: `live-co-${slug}`,
      name: companyName,
      slug,
      country: "Slovenia",
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
      scrapeRSSFeed(sourceStub(source.name, source.feedUrl)).then((articles) => ({
        source,
        articles,
      }))
    )
  );

  const seenUrls = new Set<string>();
  const opportunities: Opportunity[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { source, articles } = result.value;
    for (const article of articles) {
      if (!article.url || seenUrls.has(article.url)) continue;
      seenUrls.add(article.url);
      const opp = toOpportunity(article, source.name);
      if (opp) opportunities.push(opp);
    }
  }

  opportunities.sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0));

  return {
    opportunities: opportunities.slice(0, MAX_RESULTS),
    fetchedAt: new Date().toISOString(),
  };
}

export interface LiveSignalsResult {
  opportunities: Opportunity[];
  fetchedAt: string;
  cached: boolean;
}

/**
 * Returns live Slovenian business-signal opportunities, using a 20-minute
 * in-memory cache to avoid hammering the public RSS feeds. Never throws —
 * any per-source or total failure simply results in an empty array, letting
 * the caller fall back to mock data.
 */
export async function getLiveSlovenianSignals(): Promise<LiveSignalsResult> {
  if (cache && Date.now() - new Date(cache.fetchedAt).getTime() < CACHE_TTL_MS) {
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
 * Synchronous lookup into whatever is currently cached — used by the
 * opportunity detail route to resolve `live-*` ids without re-fetching.
 * Returns null if nothing is cached yet or the id isn't in it.
 */
export function getCachedLiveOpportunity(id: string): Opportunity | null {
  return cache?.opportunities.find((o) => o.id === id) ?? null;
}
