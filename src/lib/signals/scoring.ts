import type { OpportunityType } from "@/types";
import { OPPORTUNITY_TYPE_CONFIG } from "@/types";
import { extractCompanyName } from "./keywords";

// ============================================================
// Weighted relevance scoring for the Slovenian Business Signal Engine.
// Deterministic only — no AI. Every concept below is matched as a whole
// word/phrase (Slovenian + English variants, since one source publishes in
// English) and contributes a fixed weight to the final 0-100 score.
// ============================================================

export const RELEVANCE_THRESHOLD = 60;

interface SignalConcept {
  concept: string;
  terms: string[];
  weight: number;
  type: OpportunityType;
}

export const POSITIVE_SIGNALS: SignalConcept[] = [
  { concept: "investicija", terms: ["investicija", "naložba", "investment"], weight: 20, type: "investment" },
  { concept: "širitev", terms: ["širitev", "razširitev", "expansion"], weight: 16, type: "expansion" },
  { concept: "nova tovarna", terms: ["nova tovarna", "nova proizvodna hala", "new factory"], weight: 26, type: "factory_expansion" },
  { concept: "novo skladišče", terms: ["novo skladišče", "nov skladiščni objekt", "new warehouse"], weight: 22, type: "factory_expansion" },
  { concept: "gradnja", terms: ["gradnja", "gradbena dela", "izgradnja", "construction"], weight: 14, type: "construction" },
  { concept: "zaposlovanje", terms: ["zaposlovanje", "nova delovna mesta", "zaposluje", "hiring"], weight: 16, type: "hiring" },
  { concept: "javni razpis", terms: ["javni razpis", "javno naročilo", "public tender"], weight: 20, type: "government_tender" },
  { concept: "subvencija", terms: ["subvencija", "spodbuda", "subsidy"], weight: 18, type: "funding" },
  { concept: "evropska sredstva", terms: ["evropska sredstva", "sredstva eu", "kohezijska sredstva", "eu funding"], weight: 20, type: "funding" },
  { concept: "prevzem", terms: ["prevzem podjetja", "nakup podjetja", "acquisition"], weight: 22, type: "acquisition" },
  { concept: "partnerstvo", terms: ["strateško partnerstvo", "poslovno partnerstvo", "partnership"], weight: 14, type: "partnership" },
  { concept: "povečanje proizvodnje", terms: ["povečanje proizvodnje", "povečana proizvodnja", "production increase"], weight: 20, type: "factory_expansion" },
  { concept: "izvoz", terms: ["izvoz", "izvozni trg", "export"], weight: 14, type: "expansion" },
  { concept: "nova pisarna", terms: ["nova pisarna", "novi poslovni prostori", "new office"], weight: 16, type: "expansion" },
  { concept: "nova poslovalnica", terms: ["nova poslovalnica", "nova podružnica", "new branch"], weight: 18, type: "expansion" },
  { concept: "logistični center", terms: ["logistični center", "distribucijski center", "logistics center"], weight: 22, type: "factory_expansion" },
  { concept: "obnovljivi viri energije", terms: ["obnovljivi viri energije", "sončna elektrarna", "vetrna elektrarna", "renewable energy"], weight: 22, type: "energy_project" },
  { concept: "proizvodnja", terms: ["proizvodnja", "industrijska proizvodnja", "manufacturing"], weight: 14, type: "factory_expansion" },
  { concept: "industrijski projekt", terms: ["industrijski projekt", "industrijska cona", "industrial project"], weight: 20, type: "factory_expansion" },
];

export const NEGATIVE_SIGNALS: SignalConcept[] = [
  { concept: "politika", terms: ["politika", "politični", "politics"], weight: 32, type: "other" },
  { concept: "volitve", terms: ["volitve", "volilna kampanja", "elections"], weight: 32, type: "other" },
  { concept: "nato", terms: ["nato"], weight: 40, type: "other" },
  { concept: "rusija", terms: ["rusija", "russia"], weight: 35, type: "other" },
  { concept: "ukrajina", terms: ["ukrajina", "ukraine"], weight: 35, type: "other" },
  { concept: "vojna", terms: ["vojna", "war"], weight: 40, type: "other" },
  { concept: "vojska", terms: ["vojska", "vojaški", "military"], weight: 35, type: "other" },
  { concept: "šport", terms: ["šport", "nogomet", "košarka", "tekma", "prvenstvo", "sports"], weight: 30, type: "other" },
  { concept: "nesreča", terms: ["nesreča", "prometna nesreča", "accident"], weight: 28, type: "other" },
  { concept: "kriminal", terms: ["kriminal", "umor", "tatvina", "kaznivo dejanje", "crime"], weight: 32, type: "other" },
  { concept: "smrt", terms: ["smrt", "umrl", "žrtev", "death"], weight: 32, type: "other" },
  { concept: "vreme", terms: ["vreme", "vremenska napoved", "neurje", "toča", "weather"], weight: 24, type: "other" },
  { concept: "kultura", terms: ["kultura", "razstava", "festival", "koncert", "culture"], weight: 18, type: "other" },
  { concept: "zabava", terms: ["zabava", "šov", "entertainment"], weight: 18, type: "other" },
  { concept: "mnenje", terms: ["mnenje", "kolumna", "komentar", "opinion"], weight: 22, type: "other" },
  // Ceremonial / diplomatic coverage — not war or politics per se, but not a
  // commercial signal either (e.g. national-day receptions, embassy events).
  { concept: "slovesnost", terms: ["sprejem", "slovesnost", "obletnica", "veleposlaništvo", "diplomatski", "govor", "reception", "ceremony", "anniversary"], weight: 28, type: "other" },
];

// JS `\b` doesn't understand Slovenian diacritics, so this checks real word
// boundaries by hand (shared logic, duplicated from keywords.ts to keep this
// module self-contained).
const SL_WORD_CHAR = /[a-zA-ZčšžćđČŠŽĆĐ0-9]/;

function includesWholeWord(haystack: string, needle: string): boolean {
  let fromIndex = 0;
  for (;;) {
    const idx = haystack.indexOf(needle, fromIndex);
    if (idx === -1) return false;
    const before = idx > 0 ? haystack[idx - 1] : "";
    const after = idx + needle.length < haystack.length ? haystack[idx + needle.length] : "";
    if (!SL_WORD_CHAR.test(before) && !SL_WORD_CHAR.test(after)) return true;
    fromIndex = idx + 1;
  }
}

function matchConcepts(normalized: string, concepts: SignalConcept[]): SignalConcept[] {
  return concepts.filter((c) => c.terms.some((term) => includesWholeWord(normalized, term.toLowerCase())));
}

export interface ScoredArticle {
  score: number;
  confidence: number;
  type: OpportunityType;
  matchedPositive: SignalConcept[];
  matchedNegative: SignalConcept[];
}

// One source (Slovenia Times) aggregates some regional/international wire
// content alongside real Slovenian business news. Since this whole engine
// exists to find *Slovenian* opportunities, articles with no Slovenia
// indicator at all (no "Slovenija/Slovenia" mention, no known municipality)
// get a relevance penalty rather than being treated as domestic news.
function hasSlovenianContext(text: string): boolean {
  const normalized = text.toLowerCase().normalize("NFC");
  if (
    includesWholeWord(normalized, "slovenija") ||
    includesWholeWord(normalized, "slovenia") ||
    includesWholeWord(normalized, "slovenski") ||
    includesWholeWord(normalized, "slovenska") ||
    includesWholeWord(normalized, "slovensko")
  ) {
    return true;
  }
  return !!extractMunicipality(text);
}

const NON_SLOVENIAN_PENALTY = 25;

/**
 * Weighted relevance score for an article: baseline + strongest matched
 * signal + a small bonus per additional distinct signal, minus the sum of
 * matched negative-signal weights, minus a penalty if nothing ties the story
 * to Slovenia, plus a small recency bonus. Returns null if there's no
 * positive signal at all, or the score falls below RELEVANCE_THRESHOLD (60)
 * — both cases mean "reject, not a real opportunity".
 */
export function scoreArticle(text: string, publishedAt?: string): ScoredArticle | null {
  const normalized = text.toLowerCase().normalize("NFC");

  const matchedPositive = matchConcepts(normalized, POSITIVE_SIGNALS);
  if (!matchedPositive.length) return null;

  const matchedNegative = matchConcepts(normalized, NEGATIVE_SIGNALS);

  const strongest = Math.max(...matchedPositive.map((c) => c.weight));
  const additionalBonus = Math.min(3, matchedPositive.length - 1) * 6;
  const positiveScore = 40 + strongest + additionalBonus;

  const negativePenalty = matchedNegative.reduce((sum, c) => sum + c.weight, 0);
  const geoPenalty = hasSlovenianContext(text) ? 0 : NON_SLOVENIAN_PENALTY;

  const hoursAgo = publishedAt ? (Date.now() - new Date(publishedAt).getTime()) / 3_600_000 : Infinity;
  const recencyBonus = hoursAgo <= 24 ? 5 : 0;

  const score = Math.max(0, Math.min(100, positiveScore - negativePenalty - geoPenalty + recencyBonus));
  if (score < RELEVANCE_THRESHOLD) return null;

  const primaryType = matchedPositive.find((c) => c.weight === strongest)!.type;

  const confidence = Math.min(
    98,
    50 + Math.min(4, matchedPositive.length) * 8 + (matchedNegative.length ? -10 : 0)
  );

  return { score, confidence, type: primaryType, matchedPositive, matchedNegative };
}

export function buildWhyItMatters(matchedPositive: SignalConcept[], type: OpportunityType): string {
  const labels = matchedPositive.slice(0, 3).map((c) => c.concept);
  const typeLabel = OPPORTUNITY_TYPE_CONFIG[type]?.label ?? type;
  return `Članek omenja: ${labels.join(", ")} — kar kaže na realno poslovno priložnost v kategoriji "${typeLabel}".`;
}

// ============================================================
// Municipality (city) extraction — plain lookup against major Slovenian
// municipalities, whole-word matched.
// ============================================================

const MUNICIPALITIES: string[] = [
  "Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto", "Ptuj",
  "Trbovlje", "Kamnik", "Jesenice", "Nova Gorica", "Murska Sobota", "Domžale",
  "Škofja Loka", "Slovenj Gradec", "Postojna", "Krško", "Sežana", "Brežice",
  "Ajdovščina", "Izola", "Piran", "Kočevje", "Ribnica", "Litija", "Grosuplje",
  "Vrhnika", "Logatec", "Idrija", "Tolmin", "Radovljica", "Bled", "Bohinj",
  "Zagorje", "Hrastnik", "Laško", "Rogaška Slatina", "Slovenske Konjice", "Žalec",
  "Ormož", "Lenart", "Gornja Radgona", "Ljutomer", "Metlika", "Črnomelj", "Sevnica", "Trebnje",
];

// Slovenian is a declined language ("v Kočevju" is the locative of
// "Kočevje"), so exact-name matching misses most real mentions. Instead we
// match on the stem shared by all common noun cases — everything but the
// last one or two characters — as a whole-word prefix.
function municipalityStem(name: string): string {
  const lastWord = name.split(" ").pop()!;
  return lastWord.length > 5 ? lastWord.slice(0, -2) : lastWord.slice(0, -1);
}

function includesStemAsWord(haystack: string, stem: string): boolean {
  if (stem.length < 3) return false; // too short to be a reliable, low-false-positive match
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${stem}\\p{L}{0,3})(?:[^\\p{L}\\p{N}]|$)`, "u");
  const match = haystack.match(re);
  // Require the matched word to be capitalized — real municipality mentions
  // always are, and this filters out most incidental lowercase-word collisions.
  return !!match && /^[A-ZČŠŽ]/.test(match[1]);
}

export function extractMunicipality(text: string): string | null {
  for (const name of MUNICIPALITIES) {
    if (includesStemAsWord(text, municipalityStem(name))) return name;
  }
  return null;
}

// ============================================================
// Industry extraction — plain phrase lookup.
// ============================================================

const INDUSTRY_KEYWORDS: { phrase: string; label: string }[] = [
  { phrase: "avtomobilska industrija", label: "Avtomobilska industrija" },
  { phrase: "lesna industrija", label: "Lesna industrija" },
  { phrase: "kovinska industrija", label: "Kovinska industrija" },
  { phrase: "kovinsko predelovalna", label: "Kovinska industrija" },
  { phrase: "prehrambna industrija", label: "Živilska industrija" },
  { phrase: "živilska industrija", label: "Živilska industrija" },
  { phrase: "tekstilna industrija", label: "Tekstilna industrija" },
  { phrase: "farmacevtska industrija", label: "Farmacija" },
  { phrase: "farmacija", label: "Farmacija" },
  { phrase: "kemična industrija", label: "Kemična industrija" },
  { phrase: "gradbeništvo", label: "Gradbeništvo" },
  { phrase: "energetika", label: "Energetika" },
  { phrase: "kmetijstvo", label: "Kmetijstvo" },
  { phrase: "logistika", label: "Logistika" },
  { phrase: "turizem", label: "Turizem" },
  { phrase: "trgovina", label: "Trgovina" },
  { phrase: "informacijske tehnologije", label: "Informacijske tehnologije" },
  { phrase: "informacijska tehnologija", label: "Informacijske tehnologije" },
  { phrase: "elektroindustrija", label: "Elektroindustrija" },
  { phrase: "papirna industrija", label: "Papirna industrija" },
  { phrase: "plastična industrija", label: "Plastična industrija" },
];

export function extractIndustry(text: string): string | null {
  const normalized = text.toLowerCase().normalize("NFC");
  for (const { phrase, label } of INDUSTRY_KEYWORDS) {
    if (includesWholeWord(normalized, phrase)) return label;
  }
  return null;
}

// ============================================================
// Company / institution extraction.
// Ministries, government and generic institutions are only kept as the
// "company" when they represent an actual buying opportunity (tenders,
// subsidies) — otherwise they're discarded per requirement.
// ============================================================

// Ministry names are lowercase after "za" ("Ministrstvo za gospodarstvo,
// turizem in šport") and end as soon as the sentence moves on to a verb
// ("objavilo", "napovedalo", ...) or a new capitalized clause. A plain
// greedy word-count regex swallows that next clause too (producing garbage
// like "Ministrstvo objavilo Javni razpis za podelitev priznanj"), so this
// walks word-by-word and stops at the first verb/connector or capitalized word.
const MINISTRY_STOP_WORDS = new Set([
  "objavilo", "objavila", "objavil", "napovedalo", "napovedala", "napovedal",
  "razpisalo", "razpisala", "razpisal", "sporočilo", "sporočila", "sporočil",
  "je", "bo", "bodo", "so", "danes", "včeraj", "poziva", "vabi", "opozarja", "predstavilo",
]);

function extractMinistry(text: string): string | null {
  const match = text.match(/Ministrstvo(?:\s+za)?(?:\s+[\wčšžćđĆŠŽĆĐ,]+){0,6}/);
  if (!match) return null;

  const words = match[0].split(/\s+/);
  const kept: string[] = [words[0]];
  for (let i = 1; i < words.length; i++) {
    const bare = words[i].replace(/[,.]$/, "");
    if (MINISTRY_STOP_WORDS.has(bare.toLowerCase()) || /^[A-ZČŠŽ]/.test(bare)) break;
    kept.push(words[i]);
  }
  if (kept.length < 2) return null; // bare "Ministrstvo" alone isn't useful
  return kept.join(" ").replace(/[,.]$/, "");
}

const INSTITUTION_PATTERNS: RegExp[] = [
  /Vlada Republike Slovenije/,
  /Občina\s+[A-ZČŠŽ][\wčšž]*/,
  /Agencija(?:\s+[A-ZČŠŽa-zčšž]+){1,4}/,
  /[A-ZČŠŽ][\wčšž]*\s+sklad/,
];

function extractInstitution(text: string): string | null {
  const ministry = extractMinistry(text);
  if (ministry) return ministry;

  for (const pattern of INSTITUTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ").trim().replace(/[,.]$/, "");
  }
  return null;
}

export interface ExtractedCompany {
  name: string;
  isInstitution: boolean;
}

export function extractCompanyEntity(text: string, type: OpportunityType): ExtractedCompany | null {
  const legalMatch = extractCompanyName(text);
  if (legalMatch) return { name: legalMatch, isInstitution: false };

  const institution = extractInstitution(text);
  if (institution) {
    const isBuyingOpportunity = type === "government_tender" || type === "funding";
    return isBuyingOpportunity ? { name: institution, isInstitution: true } : null;
  }

  return null;
}
