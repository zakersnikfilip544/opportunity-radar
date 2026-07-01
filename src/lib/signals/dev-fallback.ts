/**
 * Mock data must stay a developer-only fallback, never shown to real users
 * as if it were live data. Off by default; a developer opts in locally with
 * RADAR_DEV_FALLBACK=1 (e.g. to work on UI without network access).
 */
export function isDevFallbackEnabled(): boolean {
  return process.env.RADAR_DEV_FALLBACK === "1" || process.env.RADAR_DEV_FALLBACK === "true";
}
