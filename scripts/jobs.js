#!/usr/bin/env node
/**
 * Background job runner for Opportunity Radar.
 * Triggers scraping and digest generation via HTTP to the Next.js app.
 * Run this separately or inside Docker.
 */

const cron = require("node-cron");
const https = require("https");
const http = require("http");

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";

function makeRequest(path, method = "POST", body = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, APP_URL);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;
    const data = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    };

    const req = lib.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function runScrape() {
  console.log(`[Jobs] ${new Date().toISOString()} — Starting scrape...`);
  try {
    const result = await makeRequest("/api/scrape", "POST", {});
    if (result.status === 200) {
      const { totals } = result.data;
      console.log(
        `[Jobs] Scrape complete: ${totals?.articles_found} found, ` +
        `${totals?.articles_new} new, ${totals?.opportunities_created} opportunities created`
      );
    } else {
      console.error("[Jobs] Scrape failed:", result.data);
    }
  } catch (err) {
    console.error("[Jobs] Scrape error:", err.message);
  }
}

async function runDigest() {
  console.log(`[Jobs] ${new Date().toISOString()} — Generating daily digest...`);
  try {
    const result = await makeRequest("/api/digest", "POST", {});
    if (result.status === 200) {
      console.log("[Jobs] Digest generated:", result.data.title);
    } else {
      console.log("[Jobs] Digest response:", result.status, result.data?.message || result.data?.error);
    }
  } catch (err) {
    console.error("[Jobs] Digest error:", err.message);
  }
}

// Wait for app to be ready
async function waitForApp(maxWait = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const result = await makeRequest("/api/health", "GET", undefined);
      if (result.status === 200) {
        console.log("[Jobs] App is ready.");
        return true;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.error("[Jobs] App did not become ready in time.");
  return false;
}

async function main() {
  console.log("[Jobs] Starting Opportunity Radar background jobs...");
  console.log(`[Jobs] App URL: ${APP_URL}`);

  await waitForApp();

  // Run immediately on startup
  await runScrape();
  await runDigest();

  // Scrape every 2 hours
  cron.schedule("0 */2 * * *", runScrape);

  // Generate digest at 7 AM daily
  cron.schedule("0 7 * * *", runDigest);

  console.log("[Jobs] Scheduler running. Scrape: every 2h | Digest: 7 AM daily.");
}

main().catch(console.error);
