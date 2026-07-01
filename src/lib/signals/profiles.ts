import { SIGNAL_KEYWORD_RULES, type KeywordRule } from "./keywords";

export type ProfileId = "plan-b" | "konekt" | "besolar" | "splosno";

export interface BusinessProfile {
  id: ProfileId;
  label: string;
  /** Keywords (with type mapping) this profile cares about — used both for
   *  detection (via the master ruleset below) and for filtering the live pool. */
  keywordRules: KeywordRule[];
  /** Vocabulary of services/angles this profile sells. */
  salesAngleTerms: string[];
  /** Deterministic, profile-branded override for the "Sales Angle" card. */
  salesAngleText: string;
  /** Deterministic, profile-branded override for "Suggested Action". */
  recommendedAction: string;
}

// Plan B's vocabulary is deliberately narrow — only concepts that genuinely
// signal branding/marketing/digital spend (companies growing, rebranding
// potential, expansion, marketing, digitalisation, new products, new
// locations, investments). No bare "event"/"startup"-type catch-alls that
// used to surface generic ceremonial or unrelated news.
const PLAN_B: BusinessProfile = {
  id: "plan-b",
  label: "Plan B",
  keywordRules: [
    { keyword: "rast podjetja", type: "expansion" },
    { keyword: "prenova blagovne znamke", type: "new_product" },
    { keyword: "širitev", type: "expansion" },
    { keyword: "trženje", type: "other" },
    { keyword: "digitalizacija", type: "digital_transformation" },
    { keyword: "nov izdelek", type: "new_product" },
    { keyword: "nova lokacija", type: "expansion" },
    { keyword: "nova poslovalnica", type: "expansion" },
    { keyword: "investicija", type: "investment" },
  ],
  salesAngleTerms: ["branding", "spletna stran", "landing page", "video", "foto", "oglaševanje", "email marketing"],
  salesAngleText:
    "Predlagane storitve Plan B: branding, spletna stran, landing page, video, foto, oglaševanje, email marketing.",
  recommendedAction:
    "Poiščite marketinškega vodjo ali lastnika podjetja in ga kontaktirajte v naslednjih 7 dneh s ponudbo Plan B (branding, spletna stran, oglaševanje), dokler je priložnost še aktualna.",
};

const KONEKT: BusinessProfile = {
  id: "konekt",
  label: "KONEKT",
  keywordRules: [
    { keyword: "zaposluje", type: "hiring" },
    { keyword: "nova delovna mesta", type: "hiring" },
    { keyword: "širitev ekipe", type: "hiring" },
    { keyword: "nova poslovalnica", type: "expansion" },
    { keyword: "rast podjetja", type: "expansion" },
    { keyword: "hr", type: "hiring" },
    { keyword: "kadri", type: "hiring" },
    { keyword: "digitalizacija", type: "digital_transformation" },
  ],
  salesAngleTerms: ["HR aplikacija", "interna komunikacija", "onboarding", "dokumenti", "obvestila", "procesi zaposlenih"],
  salesAngleText:
    "Predlagane storitve KONEKT: HR aplikacija, interna komunikacija, onboarding, dokumenti, obvestila, procesi zaposlenih.",
  recommendedAction:
    "Predstavite KONEKT-ovo HR aplikacijo za digitalizacijo kadrovskih procesov in interne komunikacije.",
};

const BESOLAR: BusinessProfile = {
  id: "besolar",
  label: "Besolar",
  keywordRules: [
    { keyword: "nova hala", type: "factory_expansion" },
    { keyword: "proizvodnja", type: "factory_expansion" },
    { keyword: "industrija", type: "factory_expansion" },
    { keyword: "kmetija", type: "energy_project" },
    { keyword: "energetski projekt", type: "energy_project" },
    { keyword: "sončna elektrarna", type: "energy_project" },
    { keyword: "subvencija", type: "funding" },
    { keyword: "investicija", type: "investment" },
    { keyword: "širitev objekta", type: "construction" },
  ],
  salesAngleTerms: ["sončna elektrarna", "baterija", "EV polnilnica", "energetska neodvisnost"],
  salesAngleText: "Predlagane storitve Besolar: sončna elektrarna, baterija, EV polnilnica, energetska neodvisnost.",
  recommendedAction:
    "Predstavite Besolar rešitve za sončno elektrarno, hranilnik energije (baterijo) in energetsko neodvisnost.",
};

// "Splošno" imposes no extra filter — it matches everything the master
// ruleset below already detects as a valid business signal.
const SPLOSNO: BusinessProfile = {
  id: "splosno",
  label: "Splošno",
  keywordRules: SIGNAL_KEYWORD_RULES,
  salesAngleTerms: [],
  salesAngleText: "",
  recommendedAction: "",
};

export const BUSINESS_PROFILES: BusinessProfile[] = [PLAN_B, KONEKT, BESOLAR, SPLOSNO];

export function getProfile(id: string | null | undefined): BusinessProfile {
  return BUSINESS_PROFILES.find((p) => p.id === id) ?? SPLOSNO;
}

// Master detection ruleset = union of every profile's keywords (+ the base
// generic list), deduped by keyword. This is what actually gets scanned
// against incoming articles — profile selection then filters that pool.
function buildMasterKeywordRules(): KeywordRule[] {
  const byKeyword = new Map<string, KeywordRule>();
  for (const rule of SIGNAL_KEYWORD_RULES) byKeyword.set(rule.keyword, rule);
  for (const profile of [PLAN_B, KONEKT, BESOLAR]) {
    for (const rule of profile.keywordRules) {
      if (!byKeyword.has(rule.keyword)) byKeyword.set(rule.keyword, rule);
    }
  }
  return [...byKeyword.values()];
}

export const MASTER_KEYWORD_RULES: KeywordRule[] = buildMasterKeywordRules();

export function profileMatches(profile: BusinessProfile, matchedKeywords: string[]): boolean {
  if (profile.id === "splosno") return true;
  const profileKeywords = new Set(profile.keywordRules.map((r) => r.keyword));
  return matchedKeywords.some((k) => profileKeywords.has(k));
}
