import Parser from "rss-parser";
import type { RawArticle, Source } from "@/types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "OpportunityRadar/1.0 (business intelligence crawler)",
  },
});

export interface ScrapedArticle {
  external_id?: string;
  title: string;
  content?: string;
  url: string;
  published_at?: string;
  author?: string;
}

export async function scrapeRSSFeed(
  source: Source
): Promise<ScrapedArticle[]> {
  const feedUrl = source.feed_url || source.url;

  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.map((item) => ({
      external_id: item.guid || item.link,
      title: item.title || "Untitled",
      content: cleanContent(item.contentSnippet || item.content || item.summary || ""),
      url: item.link || "",
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      author: item.creator || item.author,
    })).filter((a) => a.url);
  } catch (error) {
    console.error(`[RSS] Failed to scrape ${feedUrl}:`, error);
    return [];
  }
}

function cleanContent(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}
