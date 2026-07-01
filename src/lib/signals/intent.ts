import type { OpportunityType } from "@/types";
import {
  POSITIVE_SIGNALS,
  includesWholeWord,
  matchConcepts,
  hasSlovenianContext,
  extractMunicipality,
  hasIdentifiableEntity,
  type SignalConcept,
} from "./scoring";

// ============================================================
// Business Intent Layer.
//
// Before anything becomes an "opportunity" it has to survive one question:
// "Would a salesperson realistically contact this company because of this
// event?" Everything below exists to answer that deterministically — no AI.
//
// Pipeline: classify (A/B/C) → score (intent, commercial potential, buying
// probability) → gate on all three thresholds → generate reasoning text.
// ============================================================

interface NamedSignal {
  concept: string;
  terms: string[];
}

// Tier C — non-business. A single match here is an unconditional hard
// reject, regardless of any Tier A signal elsewhere in the same article.
const TIER_C_NON_BUSINESS: NamedSignal[] = [
  { concept: "politika", terms: ["politika", "politični", "politics"] },
  { concept: "volitve", terms: ["volitve", "volilna kampanja", "elections"] },
  { concept: "diplomacija", terms: ["diplomacija", "diplomatski", "veleposlaništvo", "diplomacy", "embassy"] },
  { concept: "nato", terms: ["nato"] },
  { concept: "rusija", terms: ["rusija", "russia"] },
  { concept: "ukrajina", terms: ["ukrajina", "ukraine"] },
  { concept: "vojna", terms: ["vojna", "war"] },
  { concept: "vojska", terms: ["vojska", "vojaški", "military"] },
  { concept: "šport", terms: ["šport", "nogomet", "košarka", "tekma", "prvenstvo", "sports"] },
  { concept: "nesreča", terms: ["nesreča", "prometna nesreča", "accident"] },
  { concept: "kriminal", terms: ["kriminal", "umor", "tatvina", "kaznivo dejanje", "crime"] },
  { concept: "smrt", terms: ["smrt", "umrl", "žrtev", "death"] },
  { concept: "vreme", terms: ["vreme", "vremenska napoved", "neurje", "toča", "weather"] },
  { concept: "zabava", terms: ["zabava", "šov", "entertainment"] },
  { concept: "kultura", terms: ["kultura", "razstava", "festival", "koncert", "culture"] },
];

// Tier B — neutral business news. Business-flavored, but not itself a
// buying-triggering event: interviews, opinion, conferences, awards, bare
// product mentions, generic economic commentary. Doesn't hard-reject (a
// real investment story can legitimately be told *through* an interview),
// but each match reduces the Business Intent Score.
const TIER_B_NEUTRAL: NamedSignal[] = [
  { concept: "intervju", terms: ["intervju", "interview"] },
  { concept: "mnenje", terms: ["mnenje", "kolumna", "komentar", "opinion"] },
  { concept: "konferenca", terms: ["konferenca", "posvet", "okrogla miza", "conference"] },
  { concept: "nagrada", terms: ["nagrada", "priznanje", "award"] },
  { concept: "sprejem", terms: ["sprejem", "slovesnost", "obletnica", "govor", "reception", "ceremony", "anniversary"] },
  { concept: "gospodarske novice", terms: ["gospodarske novice", "gospodarski pregled", "napovedi za", "obeti za"] },
];

function matchNamed(normalized: string, signals: NamedSignal[]): NamedSignal[] {
  return signals.filter((s) => s.terms.some((t) => includesWholeWord(normalized, t)));
}

// ============================================================
// Scale indicators for Commercial Potential — does this event have real
// size/money behind it, or is it a vague mention?
// ============================================================

const MONEY_REGEX = /\d[\d.,]*\s*(evrov?|eur|€|milijon\w*|milijard\w*|mio)/i;
const JOBS_REGEX = /\d+\s*(delovnih mest|novih delovnih mest|zaposlenih|novih mest)/i;
const SIZE_REGEX = /\d[\d.,]*\s*(m2|m²|kvadratnih metrov|hektarjev|ha\b)/i;

// ============================================================
// Reason labels — the specific matched Tier A concept, in the phrasing the
// requirements ask for ("Company expansion", "New facility", ...).
// ============================================================

const REASON_LABELS: Record<string, string> = {
  "investicija": "Investicija",
  "širitev": "Širitev podjetja",
  "nova tovarna": "Nov obrat",
  "novo skladišče": "Nov objekt",
  "gradnja": "Gradbeni projekt",
  "zaposlovanje": "Rast zaposlovanja",
  "javni razpis": "Javni razpis",
  "subvencija": "Financiranje",
  "evropska sredstva": "Financiranje",
  "prevzem": "Prevzem podjetja",
  "partnerstvo": "Partnerstvo",
  "povečanje proizvodnje": "Nov obrat",
  "izvoz": "Širitev izvoza",
  "nova pisarna": "Nova pisarna",
  "nova poslovalnica": "Nova poslovalnica",
  "logistični center": "Nov objekt",
  "obnovljivi viri energije": "Energetski projekt",
  "proizvodnja": "Nov obrat",
  "industrijski projekt": "Nov obrat",
};

// ============================================================
// Upgraded reasoning templates — consequence-oriented, not "article
// mentions X". Explains what kind of spending the event typically triggers,
// and gives a practical, time-bound first action.
// ============================================================

const WHY_IT_MATTERS_TEMPLATES: Record<OpportunityType, string> = {
  investment: "Podjetje investira, kar pogosto zahteva novo blagovno znamko, spletno stran, marketinško gradivo in digitalno komunikacijo.",
  expansion: "Podjetje širi poslovanje, kar običajno sproži potrebo po novi znamki, spletni strani, oglaševanju in komunikaciji z novim trgom.",
  factory_expansion: "Podjetje gradi ali širi proizvodne zmogljivosti, kar odpira potrebo po opremi, avtomatizaciji, kadrovanju in energetskih rešitvah.",
  construction: "Gradbeni projekt te velikosti zahteva izvajalce, opremo in pogosto tudi energetske ter logistične rešitve, ki jih je treba naročiti zgodaj.",
  hiring: "Podjetje aktivno zaposluje, kar kaže na rast in potrebo po kadrovskih, HR ter digitalnih orodjih za obvladovanje večje ekipe.",
  government_tender: "Objavljen javni razpis pomeni odprto priložnost za ponudbo — okno za prijavo ali partnersko sodelovanje je časovno omejeno.",
  funding: "Podjetje je pridobilo sredstva (subvencijo ali evropsko financiranje), ki jih mora porabiti v določenem roku, kar ustvarja takojšnjo potrebo po izvedbenih partnerjih.",
  acquisition: "Prevzem podjetja pogosto sproži prenovo znamke, uskladitev sistemov in novo komunikacijsko strategijo za združeno podjetje.",
  partnership: "Novo strateško partnerstvo pogosto potrebuje skupno komunikacijsko in trženjsko podporo za predstavitev sodelovanja trgu.",
  new_product: "Lansiranje novega izdelka zahteva trženje, blagovno znamko, spletno prisotnost in komunikacijsko kampanjo ob predstavitvi.",
  technology_adoption: "Uvajanje nove tehnologije pogosto zahteva svetovanje, izobraževanje uporabnikov in podporo pri implementaciji.",
  energy_project: "Energetski projekt (sončna elektrarna, obnovljivi viri) pogosto potrebuje dodatno opremo, hranilnike energije in tehnično podporo.",
  digital_transformation: "Digitalizacija poslovanja odpira potrebo po novih orodjih, integracijah in spremljajoči komunikacijski podpori.",
  ipo: "Priprave na javno ponudbo delnic zahtevajo intenzivno komunikacijsko in poročevalsko podporo pred in med postopkom.",
  other: "Dogodek nakazuje aktivno spremembo v podjetju, kar je pogosto zgodnje okno za ponudbo relevantnih storitev.",
};

const RECOMMENDED_ACTION_TEMPLATES: Record<OpportunityType, string> = {
  investment: "Poiščite kontaktno osebo (marketinškega vodjo ali lastnika) in jo kontaktirajte v naslednjih 7 dneh, dokler je investicija še aktualna.",
  expansion: "Identificirajte odgovorno osebo za širitev in vzpostavite stik v naslednjih 7 dneh s konkretno ponudbo za novo lokacijo ali trg.",
  factory_expansion: "Kontaktirajte vodjo projekta ali nabave v naslednjih 5–7 dneh, preden podjetje zaklene dobavitelje opreme in izvajalcev.",
  construction: "Preverite razpisno ali izvedbeno dokumentacijo in se javite vodji projekta v naslednjih 5 dneh, dokler izbor izvajalcev še poteka.",
  hiring: "Kontaktirajte HR oddelek ali vodstvo v naslednjih 7 dneh s ponudbo, ki podpre hitro rast ekipe.",
  government_tender: "Preglejte razpisno dokumentacijo takoj in pripravite ponudbo ali partnersko prijavo pred rokom oddaje.",
  funding: "Stopite v stik z odgovorno osebo v naslednjih 7 dneh in ponudite pomoč pri porabi sredstev v predpisanem roku.",
  acquisition: "Kontaktirajte vodstvo v naslednjih 10 dneh s ponudbo za podporo pri integraciji in prenovi znamke po prevzemu.",
  partnership: "Vzpostavite stik v naslednjih 7 dneh in predlagajte, kako lahko podprete predstavitev novega partnerstva trgu.",
  new_product: "Kontaktirajte trženjski oddelek pred uradnim lansiranjem, da ponudite podporo pri komunikacijski kampanji.",
  technology_adoption: "Ponudite svetovanje ali implementacijsko podporo v naslednjih 10 dneh, dokler je projekt še v fazi izbire partnerjev.",
  energy_project: "Kontaktirajte investitorja v naslednjih 7 dneh s ponudbo dopolnilne opreme (hranilniki, polnilnice) za projekt.",
  digital_transformation: "Ponudite podporo pri digitalizaciji v naslednjih 10 dneh, ko podjetje še oblikuje seznam ponudnikov.",
  ipo: "Ponudite komunikacijsko in poročevalsko podporo pred začetkom uradnega postopka javne ponudbe.",
  other: "Spremljajte razvoj dogodkov in se oglasite pri podjetju v naslednjih 14 dneh, ko bo slika jasnejša.",
};

// ============================================================
// Thresholds — all three must be met for an article to become an opportunity.
// ============================================================

export const BUSINESS_INTENT_THRESHOLD = 60;
export const COMMERCIAL_POTENTIAL_THRESHOLD = 55;
export const BUYING_PROBABILITY_THRESHOLD = 50;

export type RejectionReason = "non_business" | "low_commercial_value" | null;

export interface IntentEvaluation {
  type: OpportunityType;
  businessIntentScore: number;
  commercialPotential: number;
  buyingProbability: number;
  matchedPositive: SignalConcept[];
  reasonLabel: string;
  whyItMatters: string;
  recommendedAction: string;
}

export interface EvaluationOutcome {
  accepted: IntentEvaluation | null;
  rejectionReason: RejectionReason;
}

/**
 * The single entry point for the Business Intent Layer. Classifies the
 * article into Real Buying Signal / Neutral Business News / Non-business,
 * and — only for real buying signals — computes the three gating scores.
 * Returns `accepted: null` with a `rejectionReason` for anything that
 * doesn't clear every bar; this is deliberately strict, per the guiding
 * question: "Would a salesperson realistically contact this company
 * because of this event?"
 */
export function evaluateArticle(text: string, publishedAt?: string): EvaluationOutcome {
  const normalized = text.toLowerCase().normalize("NFC");

  // Tier C — non-business — is an unconditional hard reject.
  if (matchNamed(normalized, TIER_C_NON_BUSINESS).length > 0) {
    return { accepted: null, rejectionReason: "non_business" };
  }

  const matchedPositive = matchConcepts(normalized, POSITIVE_SIGNALS);
  const matchedNeutral = matchNamed(normalized, TIER_B_NEUTRAL);

  // No Tier A buying signal at all → this is either neutral business news
  // (Group B) or something with no business relevance whatsoever — either
  // way, not an opportunity.
  if (!matchedPositive.length) {
    return { accepted: null, rejectionReason: matchedNeutral.length ? "low_commercial_value" : "non_business" };
  }

  const strongest = Math.max(...matchedPositive.map((c) => c.weight));
  const additionalBonus = Math.min(3, matchedPositive.length - 1) * 6;
  const neutralPenalty = matchedNeutral.length * 12;

  const hoursAgo = publishedAt ? (Date.now() - new Date(publishedAt).getTime()) / 3_600_000 : Infinity;
  const recencyBonus = hoursAgo <= 24 ? 5 : 0;
  const geoPenalty = hasSlovenianContext(text) ? 0 : 25;

  const businessIntentScore = clamp(40 + strongest + additionalBonus - neutralPenalty - geoPenalty + recencyBonus);

  const hasMoney = MONEY_REGEX.test(text);
  const hasJobs = JOBS_REGEX.test(text);
  const hasSize = SIZE_REGEX.test(text);
  const commercialPotential = clamp(
    35 + (hasMoney ? 25 : 0) + (hasJobs ? 15 : 0) + (hasSize ? 10 : 0) + Math.round(strongest * 0.5)
  );

  const buyingProbability = clamp(
    30 +
      (hoursAgo <= 24 ? 25 : hoursAgo <= 72 ? 12 : 0) +
      (hasIdentifiableEntity(text) ? 25 : 0) +
      (extractMunicipality(text) ? 10 : 0) -
      (matchedNeutral.length ? 15 : 0)
  );

  if (
    businessIntentScore < BUSINESS_INTENT_THRESHOLD ||
    commercialPotential < COMMERCIAL_POTENTIAL_THRESHOLD ||
    buyingProbability < BUYING_PROBABILITY_THRESHOLD
  ) {
    return { accepted: null, rejectionReason: "low_commercial_value" };
  }

  const primary = matchedPositive.find((c) => c.weight === strongest)!;
  const reasonLabel = REASON_LABELS[primary.concept] ?? "Poslovna priložnost";

  return {
    accepted: {
      type: primary.type,
      businessIntentScore,
      commercialPotential,
      buyingProbability,
      matchedPositive,
      reasonLabel,
      whyItMatters: WHY_IT_MATTERS_TEMPLATES[primary.type],
      recommendedAction: RECOMMENDED_ACTION_TEMPLATES[primary.type],
    },
    rejectionReason: null,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

// Re-exported so callers only need to import from this module for the full
// evaluate → extract pipeline.
export { extractCompanyEntity, extractIndustry } from "./scoring";
export { extractMunicipality };
