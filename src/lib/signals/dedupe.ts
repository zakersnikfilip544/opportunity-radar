import type { Opportunity } from "@/types";

// ============================================================
// Deduplicates opportunities that are the same underlying story reported by
// multiple RSS feeds (different URLs, often differently-worded titles).
// Deterministic, no AI — Jaccard similarity over significant title words.
// ============================================================

const STOPWORDS = new Set([
  "in", "na", "za", "je", "so", "bo", "bodo", "ali", "kot", "tudi", "pri", "po", "do", "od",
  "the", "and", "for", "with", "that", "this", "from", "has", "have", "will",
]);

function normalizeTitleWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .normalize("NFC")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

function titleSimilarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.5;
const TIME_WINDOW_MS = 48 * 3_600_000; // stories published within 48h of each other

export interface DedupeResult {
  deduped: Opportunity[];
  duplicatesRemoved: number;
}

/**
 * Merges opportunities that are almost certainly the same story from
 * different outlets. The highest-scored copy survives as the primary
 * record; every merged duplicate's source is preserved in
 * `additional_sources`, and the survivor's confidence is boosted slightly
 * since multi-source corroboration is itself a signal of a real event.
 */
export function deduplicateOpportunities(opportunities: Opportunity[]): DedupeResult {
  const titleSets = opportunities.map((o) => normalizeTitleWords(o.title));
  const used = new Array(opportunities.length).fill(false);

  // Process highest-scored first so it becomes the surviving primary record.
  const order = opportunities
    .map((_, i) => i)
    .sort((a, b) => (opportunities[b].opportunity_score ?? 0) - (opportunities[a].opportunity_score ?? 0));

  const result: Opportunity[] = [];
  let duplicatesRemoved = 0;

  for (const i of order) {
    if (used[i]) continue;
    used[i] = true;
    const primary = opportunities[i];
    const additionalSources: { name: string; url: string }[] = [];

    for (const j of order) {
      if (used[j] || j === i) continue;
      const timeDiff = Math.abs(
        new Date(opportunities[i].published_at).getTime() - new Date(opportunities[j].published_at).getTime()
      );
      if (timeDiff > TIME_WINDOW_MS) continue;

      const similarity = titleSimilarity(titleSets[i], titleSets[j]);
      if (similarity < SIMILARITY_THRESHOLD) continue;

      used[j] = true;
      duplicatesRemoved++;
      const dup = opportunities[j];
      if (dup.source_name && dup.source_url) {
        additionalSources.push({ name: dup.source_name, url: dup.source_url });
      }
    }

    result.push(
      additionalSources.length > 0
        ? {
            ...primary,
            additional_sources: additionalSources,
            confidence_score: Math.min(98, (primary.confidence_score ?? 0) + 15),
          }
        : primary
    );
  }

  result.sort((a, b) => (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0));
  return { deduped: result, duplicatesRemoved };
}
