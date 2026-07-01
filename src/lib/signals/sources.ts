// ============================================================
// Verified, public Slovenian RSS feeds. No scraping, no bot-bypassing —
// plain RSS reads, one request per source per cache window.
//
// Every URL below was manually verified (curl + rss-parser, live test)
// before being added. Candidates that were tried and rejected, with reasons:
//   - STA (sta.si)              → 403, Cloudflare bot protection
//   - SPIRIT Slovenija          → /rss returns an HTML app-shell, not a feed
//   - Eko sklad                 → valid RSS but broken TLS cert chain
//                                  (Node rejects it; won't weaken TLS validation)
//   - Borzen, GZS Novice        → dead link / empty <channel/>
//   - AJPES                     → relative URLs + Windows-1250 encoding,
//                                  too fragile for a first version
//   - Portal javnih naročil     → no public RSS endpoint found
//   - Uradni list                → /rss and /vsebine-rss both redirect to an
//                                  error page, not a feed
// ============================================================

export interface SlovenianRSSSource {
  name: string;
  feedUrl: string;
}

export const SLOVENIAN_RSS_SOURCES: SlovenianRSSSource[] = [
  { name: "RTV SLO – Gospodarstvo", feedUrl: "https://img.rtvslo.si/feeds/04.xml" },
  { name: "Delo", feedUrl: "https://www.delo.si/rss" },
  { name: "24ur.com", feedUrl: "https://www.24ur.com/rss" },
  { name: "GOV.SI – Novice", feedUrl: "https://www.gov.si/novice/rss" },
  { name: "Slovenia Times", feedUrl: "https://sloveniatimes.com/rss" },
];
