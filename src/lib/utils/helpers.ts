import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { sl } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: sl });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string, fmt = "d. MMM yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: sl });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(
  value: number,
  currency = "EUR",
  compact = false
): string {
  if (compact) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} mrd ${currency}`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${currency}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ${currency}`;
    return `${value} ${currency}`;
  }
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function scoreToColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

export function scoreToGradient(score: number): string {
  if (score >= 80) return "from-green-500 to-emerald-500";
  if (score >= 60) return "from-yellow-500 to-amber-500";
  if (score >= 40) return "from-orange-500 to-red-400";
  return "from-red-500 to-rose-600";
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function getFlagEmoji(countryCode: string): string {
  const flags: Record<string, string> = {
    US: "🇺🇸", EU: "🇪🇺", DE: "🇩🇪", FR: "🇫🇷", GB: "🇬🇧",
    SI: "🇸🇮", HR: "🇭🇷", AT: "🇦🇹", IT: "🇮🇹", PL: "🇵🇱",
    NL: "🇳🇱", SE: "🇸🇪", FI: "🇫🇮", DK: "🇩🇰", ES: "🇪🇸",
    PT: "🇵🇹", CZ: "🇨🇿", SK: "🇸🇰", RO: "🇷🇴", HU: "🇭🇺",
  };
  return flags[countryCode.toUpperCase()] || "🌐";
}

const SALES_ANGLE_BY_TYPE: Record<string, string> = {
  funding: "Sveži kapital je sprostil proračun — svojo ponudbo predstavite kot najhitrejšo pot od financiranja do izvedbe, preden to zgradijo interno.",
  hiring: "Val zaposlovanja kaže na trenutno vrzel v kapacitetah — ponudite premostitev, dokler se njihova ekipa ne zapolni.",
  expansion: "Projekti vstopa na nov trg uspejo ali propadejo zaradi lokalnih izvedbenih podrobnosti — nastopite z znanjem, ki ga interno še nimajo.",
  construction: "Projekti ob začetku gradnje zgodaj zaklenejo dobavitelje — uvrstite se na ožji seznam, preden se naročanje zapre.",
  government_tender: "Javni razpisi nagradijo zgodnje, dobro dokumentirane ponudbe — ponudite pomoč pri oblikovanju tehničnega odgovora pred rokom.",
  acquisition: "Integracija po prevzemu je faza, kjer se proračun porabi najhitreje — pozicionirajte se kot ekipa, ki to izpelje brez zapletov.",
  investment: "Sveža naložba zahteva aktivno razporeditev sredstev — bodite partner, ki jim pomaga hitro uresničiti zastavljeno strategijo.",
  factory_expansion: "Širitev kapacitet potrebuje sisteme in kadre, ki rastejo skupaj z njo, ne šele po njej.",
  new_product: "Časovna okna za lansiranje so kratka — ponudite odpravo ozkega grla med njimi in datumom izdaje.",
  technology_adoption: "Zgodnji uporabniki potrebujejo partnerje za izvedbo bolj kot dobavitelje — nastopite s praktično podporo pri implementaciji.",
  energy_project: "Energetski projekti uspejo ali propadejo glede na časovnico izvedbe — bodite partner, ki varuje urnik.",
  digital_transformation: "Projekti digitalne preobrazbe brez zunanje izvedbene podpore izgubijo zagon — ponudite ohranjanje tempa.",
  partnership: "Nova partnerstva potrebujejo hitro zmago pri integraciji, da dokažejo svojo vrednost — pomagajte jim doseči prvo.",
  ipo: "Nadzor pred prvo javno ponudbo ustvarja nujne potrebe po skladnosti in poročanju — bodite pripravljeni pred začetkom predstavitev vlagateljem.",
  other: "Ta signal kaže na aktivno spremembo znotraj organizacije — prej ko se oglasite, bolj vam čas dela v prid.",
};

export function deriveSalesAngle(opp: { type: string }): string {
  return SALES_ANGLE_BY_TYPE[opp.type] ?? SALES_ANGLE_BY_TYPE.other;
}

const CONTACT_WINDOWS: Record<string, string[]> = {
  critical: [
    "Danes — v naslednjih 2–3 urah, preden konkurenca zazna isti signal.",
    "Takoj — priporočamo stik še isti dan.",
  ],
  high: [
    "V naslednjih 24–48 urah. Torkova do četrtkova dopoldneva običajno prinesejo najboljši odziv.",
    "Ta teden — najbolje pred petkom, dokler je novica še sveža.",
  ],
  medium: [
    "V naslednjih 5–7 dneh. Sredi tedna dopoldan (tor–čet, 9.–11. ura po lokalnem času) deluje najbolje.",
    "V naslednjih 1–2 tednih. Izogibajte se ponedeljkovim dopoldnevom in petkovim popoldnevom.",
  ],
  low: [
    "V naslednjih 2–3 tednih — brez časovnega pritiska, dober kandidat za postopno negovanje odnosa.",
    "V naslednjih 30 dneh — dodajte v zaporedje toplih nadaljnjih sporočil.",
  ],
};

export function deriveBestTimeToContact(opp: { id: string; urgency: string }): string {
  const options = CONTACT_WINDOWS[opp.urgency] ?? CONTACT_WINDOWS.medium;
  const hash = opp.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return options[hash % options.length];
}

export function parseValueRange(
  min?: number,
  max?: number,
  currency = "EUR"
): string {
  if (!min && !max) return "Neznano";
  if (min && max) {
    return `${formatCurrency(min, currency, true)} – ${formatCurrency(max, currency, true)}`;
  }
  if (min) return `${formatCurrency(min, currency, true)}+`;
  if (max) return `Do ${formatCurrency(max, currency, true)}`;
  return "Neznano";
}
