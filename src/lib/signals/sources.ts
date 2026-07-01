// ============================================================
// Verified, public Slovenian RSS feeds. No scraping, no bot-bypassing —
// plain RSS reads, one request per source per cache window.
//
// Each URL was manually verified (curl + rss-parser) before being added here:
//   - img.rtvslo.si/feeds/04.xml → "MMC RTV - Gospodarstvo" (RTV SLO's
//     dedicated business/economy category feed)
//   - www.delo.si/rss           → Delo (Slovenia's leading daily newspaper)
//   - www.24ur.com/rss          → 24ur.com (largest Slovenian news portal)
// ============================================================

export interface SlovenianRSSSource {
  name: string;
  feedUrl: string;
}

export const SLOVENIAN_RSS_SOURCES: SlovenianRSSSource[] = [
  { name: "RTV SLO – Gospodarstvo", feedUrl: "https://img.rtvslo.si/feeds/04.xml" },
  { name: "Delo", feedUrl: "https://www.delo.si/rss" },
  { name: "24ur.com", feedUrl: "https://www.24ur.com/rss" },
];
