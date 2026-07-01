import type { OpportunityType, UrgencyLevel } from "@/types";

// ============================================================
// Deterministic keyword rules for the Slovenian Business Signal Engine.
// No AI is used — every match is a plain, case-insensitive substring test.
// Ordered most-specific-phrase-first so overlapping matches (e.g. both
// "investicija" and "nova investicija" hit) resolve to the more specific type.
// ============================================================

export interface KeywordRule {
  keyword: string;
  type: OpportunityType;
}

export const SIGNAL_KEYWORD_RULES: KeywordRule[] = [
  { keyword: "nova proizvodna hala", type: "factory_expansion" },
  { keyword: "nova proizvodnja", type: "factory_expansion" },
  { keyword: "nova investicija", type: "investment" },
  { keyword: "investicija", type: "investment" },
  { keyword: "širitev podjetja", type: "expansion" },
  { keyword: "nova poslovalnica", type: "expansion" },
  { keyword: "nova delovna mesta", type: "hiring" },
  { keyword: "zaposlovanje", type: "hiring" },
  { keyword: "javno naročilo", type: "government_tender" },
  { keyword: "razpis", type: "government_tender" },
  { keyword: "subvencija", type: "funding" },
  { keyword: "prevzem podjetja", type: "acquisition" },
  { keyword: "partnerstvo", type: "partnership" },
  { keyword: "nov izdelek", type: "new_product" },
  { keyword: "nova storitev", type: "new_product" },
  { keyword: "sončna elektrarna", type: "energy_project" },
  { keyword: "energetski projekt", type: "energy_project" },
  { keyword: "gradnja", type: "construction" },
  { keyword: "odprtje", type: "expansion" },
];

export interface DetectedSignal {
  type: OpportunityType;
  matchedKeywords: string[];
}

/**
 * Runs every keyword rule against normalized text and returns all matches.
 * The type of the first (most specific) match becomes the signal's primary type.
 */
export function detectSignal(text: string): DetectedSignal | null {
  const normalized = text.toLowerCase().normalize("NFC");
  const matches = SIGNAL_KEYWORD_RULES.filter((rule) => normalized.includes(rule.keyword));
  if (!matches.length) return null;

  return {
    type: matches[0].type,
    matchedKeywords: [...new Set(matches.map((m) => m.keyword))],
  };
}

export function computeConfidenceScore(matchedKeywordCount: number, publishedAt?: string): number {
  const base = 55 + Math.min(matchedKeywordCount - 1, 3) * 12;
  const hoursAgo = publishedAt ? (Date.now() - new Date(publishedAt).getTime()) / 3_600_000 : Infinity;
  const recencyBonus = hoursAgo <= 24 ? 5 : 0;
  return Math.min(98, base + recencyBonus);
}

export function computeUrgency(publishedAt: string | undefined, matchedKeywordCount: number): UrgencyLevel {
  const hoursAgo = publishedAt ? (Date.now() - new Date(publishedAt).getTime()) / 3_600_000 : Infinity;
  if (hoursAgo <= 24 && matchedKeywordCount >= 3) return "critical";
  if (hoursAgo <= 24) return "high";
  if (hoursAgo <= 72) return "medium";
  return "low";
}

// Deterministic, per-type recommended action (Slovenian). Distinct from the
// generic sales-angle helper — this is the specific next step for this signal.
export const RECOMMENDED_ACTION_SL: Record<OpportunityType, string> = {
  funding: "Preverite pogoje subvencije in ponudite pomoč pri pripravi dokumentacije ali izvedbi projekta.",
  hiring: "Ponudite kadrovske ali HR storitve, dokler podjetje aktivno širi ekipo.",
  expansion: "Vzpostavite stik in predstavite storitve za podporo širitvi poslovanja.",
  construction: "Preverite obseg gradbenega projekta in ponudite ustrezne izvajalske ali svetovalne storitve.",
  government_tender: "Preglejte razpisno dokumentacijo in razmislite o prijavi ali partnerski ponudbi.",
  acquisition: "Ponudite podporo pri integraciji poslovanja po prevzemu.",
  investment: "Stopite v stik in predstavite, kako lahko podprete izvedbo napovedane investicije.",
  factory_expansion: "Ponudite rešitve za opremo, avtomatizacijo ali kadrovanje nove proizvodnje.",
  new_product: "Predstavite storitve za lansiranje in trženje novega izdelka ali storitve.",
  technology_adoption: "Ponudite tehnično svetovanje ali implementacijsko podporo.",
  energy_project: "Predstavite rešitve za energetske projekte, sončne elektrarne ali priklop na omrežje.",
  digital_transformation: "Ponudite podporo pri digitalizaciji poslovnih procesov.",
  partnership: "Raziščite možnost skupnega partnerstva ali poslovnega sodelovanja.",
  ipo: "Pripravite se na povečan nadzor in poročevalske zahteve pred IPO.",
  other: "Spremljajte razvoj dogodkov in se pravočasno oglasite pri podjetju.",
};

// Best-effort deterministic company-name extraction from Slovenian legal-form
// suffixes (d.o.o., d.d., s.p., …). No AI — plain regex, may return null.
const COMPANY_NAME_REGEX =
  /\b([A-ZČŠŽ][\wČŠŽčšžĆćĐđ.&,\-\s]{1,60}?\s(?:d\.\s?o\.\s?o\.|d\.\s?d\.|s\.\s?p\.|d\.\s?n\.\s?o\.))/;

export function extractCompanyName(text: string): string | null {
  const match = text.match(COMPANY_NAME_REGEX);
  if (!match) return null;
  return match[1].replace(/\s+/g, " ").trim();
}
