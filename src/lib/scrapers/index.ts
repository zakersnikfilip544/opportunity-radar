import { createAdminClient } from "@/lib/supabase/server";
import { scrapeRSSFeed } from "./rss";
import { scrapeHackerNews } from "./hackernews";
import { scrapeBusinessSubreddits } from "./reddit";
import { scrapeGitHubTrending } from "./github-trending";
import { analyzeArticle } from "@/lib/openai/analyzer";
import type { Source } from "@/types";

export interface ScrapeResult {
  source_name: string;
  articles_found: number;
  articles_new: number;
  opportunities_created: number;
  error?: string;
}

export async function scrapeSource(source: Source): Promise<ScrapeResult> {
  const supabase = createAdminClient();
  const result: ScrapeResult = {
    source_name: source.name,
    articles_found: 0,
    articles_new: 0,
    opportunities_created: 0,
  };

  try {
    let articles: Array<{
      external_id?: string;
      title: string;
      content?: string;
      url: string;
      published_at?: string;
      author?: string;
    }> = [];

    switch (source.type) {
      case "hacker_news":
        articles = await scrapeHackerNews(50);
        break;
      case "reddit":
        articles = await scrapeBusinessSubreddits();
        break;
      case "github_trending":
        articles = await scrapeGitHubTrending();
        break;
      case "rss":
      case "product_hunt":
      case "ycombinator":
      case "google_news":
      default:
        if (source.feed_url || source.url) {
          articles = await scrapeRSSFeed(source);
        }
        break;
    }

    result.articles_found = articles.length;

    for (const article of articles) {
      if (!article.url || !article.title) continue;

      // Check if already exists
      const { data: existing } = await supabase
        .from("raw_articles")
        .select("id")
        .eq("url", article.url)
        .single();

      if (existing) continue;

      // Insert raw article
      const { data: raw, error: insertError } = await supabase
        .from("raw_articles")
        .insert({
          source_id: source.id,
          external_id: article.external_id,
          title: article.title,
          content: article.content,
          url: article.url,
          published_at: article.published_at,
          author: article.author,
          is_processed: false,
        })
        .select()
        .single();

      if (insertError || !raw) continue;
      result.articles_new++;

      // AI Analysis
      const analysis = await analyzeArticle(
        article.title,
        article.content || article.title
      );

      if (!analysis || !analysis.is_opportunity) {
        await supabase
          .from("raw_articles")
          .update({ is_processed: true })
          .eq("id", raw.id);
        continue;
      }

      // Find or create company
      let company_id: string | null = null;
      if (analysis.company_name) {
        const slug = slugify(analysis.company_name);
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .eq("slug", slug)
          .single();

        if (existingCompany) {
          company_id = existingCompany.id;
        } else {
          const { data: newCompany } = await supabase
            .from("companies")
            .insert({
              name: analysis.company_name,
              slug,
              domain: analysis.company_domain,
              industry: analysis.company_industry || analysis.industry,
              country: analysis.country,
            })
            .select("id")
            .single();
          company_id = newCompany?.id || null;
        }
      }

      // Create opportunity
      const { error: oppError } = await supabase.from("opportunities").insert({
        title: analysis.title,
        summary: analysis.summary,
        full_analysis: analysis.full_analysis,
        type: analysis.type,
        industry: analysis.industry,
        sub_type: analysis.sub_type,
        opportunity_score: analysis.opportunity_score,
        growth_score: analysis.growth_score,
        sales_potential: analysis.sales_potential,
        urgency_score: analysis.urgency_score,
        competition_level: analysis.competition_level,
        confidence_score: analysis.confidence_score,
        urgency: analysis.urgency,
        country: analysis.country,
        city: analysis.city,
        region: analysis.region,
        company_id,
        raw_article_id: raw.id,
        source_url: article.url,
        estimated_value_min: analysis.estimated_value_min,
        estimated_value_max: analysis.estimated_value_max,
        estimated_value_currency: analysis.estimated_value_currency || "EUR",
        why_it_matters: analysis.why_it_matters,
        potential_buyers: analysis.potential_buyers,
        potential_sellers: analysis.potential_sellers,
        suggested_action: analysis.suggested_action,
        cold_email: analysis.cold_email,
        linkedin_message: analysis.linkedin_message,
        target_roles: analysis.target_roles,
        services_to_offer: analysis.services_to_offer,
        tags: analysis.tags,
        published_at: article.published_at || new Date().toISOString(),
      });

      if (!oppError) {
        result.opportunities_created++;
        await supabase
          .from("raw_articles")
          .update({ is_processed: true })
          .eq("id", raw.id);
      }

      // Rate limiting
      await sleep(500);
    }

    // Update last scraped timestamp
    await supabase
      .from("sources")
      .update({ last_scraped_at: new Date().toISOString() })
      .eq("id", source.id);
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Scraper] Error scraping ${source.name}:`, error);
  }

  return result;
}

export async function scrapeAllSources(): Promise<ScrapeResult[]> {
  const supabase = createAdminClient();

  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .eq("is_active", true);

  if (!sources?.length) return [];

  const results: ScrapeResult[] = [];
  for (const source of sources) {
    const result = await scrapeSource(source as Source);
    results.push(result);
    await sleep(2000); // Be polite between sources
  }

  return results;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
