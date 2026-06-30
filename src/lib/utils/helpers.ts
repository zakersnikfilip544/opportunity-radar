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
