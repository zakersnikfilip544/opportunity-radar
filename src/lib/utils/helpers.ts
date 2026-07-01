import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string, fmt = "MMM d, yyyy"): string {
  try {
    return format(parseISO(dateStr), fmt);
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
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B ${currency}`;
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
  funding: "Fresh capital just unlocked budget — position your offer as the fastest path from funding to execution, before they build it out in-house.",
  hiring: "A hiring wave signals a capacity gap right now — offer to bridge it while their pipeline fills.",
  expansion: "Market-entry projects live or die on local execution details — lead with expertise they don't have in-house yet.",
  construction: "Groundbreaking projects lock in suppliers early — get on the shortlist before procurement closes.",
  government_tender: "Public tenders reward early, well-documented bids — offer to help shape the technical response before the deadline.",
  acquisition: "Post-deal integration is where budgets get spent fastest — position as the team that makes it seamless.",
  investment: "Fresh investment mandates active deployment — be the partner who helps them move quickly on the thesis.",
  factory_expansion: "Capacity expansion needs systems and staffing that scale with it, not after it.",
  new_product: "Launch windows are tight — offer to remove the bottleneck standing between them and ship date.",
  technology_adoption: "Early adopters need implementation partners more than vendors — lead with hands-on delivery.",
  energy_project: "Energy projects live and die on execution timelines — be the partner who protects the schedule.",
  digital_transformation: "Transformation initiatives stall without outside execution capacity — offer to keep momentum going.",
  partnership: "New partnerships need a fast integration win to prove the thesis — help them land the first one.",
  ipo: "Pre-IPO scrutiny creates urgent compliance and reporting needs — be ready before the roadshow starts.",
  other: "This signal points to active change inside the organization — the earlier you reach out, the more the timing works in your favor.",
};

export function deriveSalesAngle(opp: { type: string }): string {
  return SALES_ANGLE_BY_TYPE[opp.type] ?? SALES_ANGLE_BY_TYPE.other;
}

const CONTACT_WINDOWS: Record<string, string[]> = {
  critical: [
    "Today — within the next 2-3 hours, before competitors reach the same signal.",
    "Immediately — same-day outreach is strongly recommended.",
  ],
  high: [
    "Within 24-48 hours. Tuesday–Thursday mornings tend to get the best response.",
    "This week — ideally before Friday, while the news is still fresh.",
  ],
  medium: [
    "Within the next 5-7 days. Mid-week mornings (Tue–Thu, 9-11am local time) work best.",
    "Within 1-2 weeks. Avoid Monday mornings and Friday afternoons.",
  ],
  low: [
    "Within the next 2-3 weeks — no immediate rush, good candidate to nurture first.",
    "Within 30 days — add to a warm follow-up sequence.",
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
  if (!min && !max) return "Unknown";
  if (min && max) {
    return `${formatCurrency(min, currency, true)} – ${formatCurrency(max, currency, true)}`;
  }
  if (min) return `${formatCurrency(min, currency, true)}+`;
  if (max) return `Up to ${formatCurrency(max, currency, true)}`;
  return "Unknown";
}
