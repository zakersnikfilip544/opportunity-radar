import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedArticle } from "./rss";

export async function scrapeGitHubTrending(
  language?: string
): Promise<ScrapedArticle[]> {
  const url = `https://github.com/trending${language ? `/${language}` : ""}?since=daily`;

  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OpportunityRadar/1.0)",
        Accept: "text/html",
      },
    });

    const $ = cheerio.load(data);
    const repos: ScrapedArticle[] = [];

    $("article.Box-row").each((_, el) => {
      const nameEl = $(el).find("h2 a");
      const name = nameEl.text().trim().replace(/\s+/g, "");
      const href = nameEl.attr("href");
      const description = $(el).find("p").first().text().trim();
      const stars = $(el).find("[aria-label*='star']").text().trim();

      if (name && href) {
        repos.push({
          external_id: `github-${name.replace("/", "-")}`,
          title: `Trending on GitHub: ${name} (${stars} stars)`,
          content: description,
          url: `https://github.com${href}`,
          published_at: new Date().toISOString(),
        });
      }
    });

    return repos.slice(0, 20);
  } catch (error) {
    console.error("[GitHub] Scrape error:", error);
    return [];
  }
}
