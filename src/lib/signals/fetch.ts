import Parser from "rss-parser";

// Dedicated RSS reader for the signal engine. Kept separate from
// `@/lib/scrapers/rss` (the legacy Supabase-oriented scraper) because some
// public Slovenian feeds reject the generic crawler UA/Accept headers used
// there — this uses a full browser-like header set that all verified
// sources accept.
const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

export interface FetchedArticle {
  title: string;
  content: string;
  url: string;
  published_at?: string;
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
    .slice(0, 2000);
}

export async function fetchFeed(feedUrl: string): Promise<FetchedArticle[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items
      .map((item) => ({
        title: (item.title || "").trim(),
        content: cleanContent(item.contentSnippet || item.content || item.summary || ""),
        url: item.link || "",
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      }))
      .filter((a) => a.url && a.title);
  } catch (error) {
    console.error(`[SignalEngine] Failed to fetch ${feedUrl}:`, error instanceof Error ? error.message : error);
    return [];
  }
}
