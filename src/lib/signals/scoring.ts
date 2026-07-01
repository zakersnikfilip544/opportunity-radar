import type { OpportunityType } from "@/types";
import { extractCompanyName } from "./keywords";

// ============================================================
// Low-level signal detection & extraction library for the Slovenian
// Business Signal Engine. Deterministic only — no AI. Every concept below
// is matched as a whole word/phrase (Slovenian + English variants, since
// one source publishes in English).
//
// This module only detects and extracts; the accept/reject decision and
// scoring live one layer up, in the Business Intent Layer (./intent.ts).
// ============================================================

export interface SignalConcept {
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

// JS `\b` doesn't understand Slovenian diacritics, so this checks real word
// boundaries by hand.
const SL_WORD_CHAR = /[a-zA-ZčšžćđČŠŽĆĐ0-9]/;

export function includesWholeWord(haystack: string, needle: string): boolean {
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

export function matchConcepts(normalized: string, concepts: SignalConcept[]): SignalConcept[] {
  return concepts.filter((c) => c.terms.some((term) => includesWholeWord(normalized, term.toLowerCase())));
}

// One source (Slovenia Times) aggregates some regional/international wire
// content alongside real Slovenian business news. Since this whole engine
// exists to find *Slovenian* opportunities, articles with no Slovenia
// indicator at all (no "Slovenija/Slovenia" mention, no known municipality)
// are treated as out of scope by the Business Intent Layer.
export function hasSlovenianContext(text: string): boolean {
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

/**
 * Type-independent presence check — is there *any* identifiable named
 * entity (company or institution) in this text at all? Used by the Business
 * Intent Layer's Buying Probability score, which needs this before the
 * opportunity `type` (and therefore the institution buying-gate) is known.
 */
export function hasIdentifiableEntity(text: string): boolean {
  return !!extractCompanyName(text) || !!extractInstitution(text);
}
