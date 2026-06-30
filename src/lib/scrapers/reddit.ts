import axios from "axios";
import type { ScrapedArticle } from "./rss";

const REDDIT_BASE = "https://www.reddit.com";

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    created_utc: number;
    author: string;
    score: number;
    num_comments: number;
    link_flair_text?: string;
  };
}

export async function scrapeSubreddit(
  subreddit: string,
  limit = 25,
  minScore = 20
): Promise<ScrapedArticle[]> {
  try {
    const { data } = await axios.get(
      `${REDDIT_BASE}/r/${subreddit}/hot.json?limit=${limit}`,
      {
        timeout: 8000,
        headers: {
          "User-Agent": "OpportunityRadar/1.0 Business Intelligence Bot",
        },
      }
    );

    const posts: RedditPost[] = data?.data?.children || [];

    return posts
      .filter((p) => p.data.score >= minScore)
      .map((p) => ({
        external_id: `reddit-${p.data.id}`,
        title: p.data.title,
        content: p.data.selftext?.slice(0, 3000) || "",
        url: p.data.url.startsWith("http")
          ? p.data.url
          : `${REDDIT_BASE}${p.data.permalink}`,
        published_at: new Date(p.data.created_utc * 1000).toISOString(),
        author: p.data.author,
      }));
  } catch (error) {
    console.error(`[Reddit] Failed to scrape r/${subreddit}:`, error);
    return [];
  }
}

export async function scrapeBusinessSubreddits(): Promise<ScrapedArticle[]> {
  const subs = ["entrepreneur", "startups", "business", "investing", "smallbusiness"];
  const results = await Promise.allSettled(subs.map((s) => scrapeSubreddit(s)));
  return results
    .filter((r): r is PromiseFulfilledResult<ScrapedArticle[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}
