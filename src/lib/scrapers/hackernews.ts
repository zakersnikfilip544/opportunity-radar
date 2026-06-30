import axios from "axios";
import type { ScrapedArticle } from "./rss";

const HN_API = "https://hacker-news.firebaseio.com/v0";
const HN_BATCH_SIZE = 30;

interface HNStory {
  id: number;
  title: string;
  url?: string;
  text?: string;
  score: number;
  time: number;
  by: string;
  descendants?: number;
}

export async function scrapeHackerNews(minScore = 50): Promise<ScrapedArticle[]> {
  try {
    const { data: topIds } = await axios.get<number[]>(
      `${HN_API}/topstories.json`,
      { timeout: 8000 }
    );

    const batch = topIds.slice(0, HN_BATCH_SIZE);
    const stories = await Promise.allSettled(
      batch.map((id) =>
        axios
          .get<HNStory>(`${HN_API}/item/${id}.json`, { timeout: 5000 })
          .then((r) => r.data)
      )
    );

    return stories
      .filter(
        (r): r is PromiseFulfilledResult<HNStory> =>
          r.status === "fulfilled" && r.value?.score >= minScore
      )
      .map((r) => ({
        external_id: `hn-${r.value.id}`,
        title: r.value.title,
        content: r.value.text || "",
        url: r.value.url || `https://news.ycombinator.com/item?id=${r.value.id}`,
        published_at: new Date(r.value.time * 1000).toISOString(),
        author: r.value.by,
      }))
      .filter((a) => a.url);
  } catch (error) {
    console.error("[HN] Scrape error:", error);
    return [];
  }
}
