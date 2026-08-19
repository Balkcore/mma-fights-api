import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { parseEventDetailsHtml, parseEventsHtml, requestPage } from "../utils/scrape.js";

const listingUrl = "https://www.tapology.com/fightcenter?group=major&schedule=upcoming";
const saveFixtures = process.argv.includes("--save-fixtures");
const proxyConfigured = Boolean(process.env.PROXY_URL?.trim());

const diagnose = async (label, useProxy) => {
  const startedAt = Date.now();
  try {
    const listing = await requestPage(listingUrl, { useProxy });
    const events = parseEventsHtml(listing.body, "mma");
    const result = {
      label,
      ok: true,
      status: listing.statusCode,
      durationMs: Date.now() - startedAt,
      events: events.length,
    };

    if (saveFixtures) {
      await mkdir("fixtures/live", { recursive: true });
      await writeFile(`fixtures/live/${label}-listing.html`, listing.body);
    }

    if (events[0]) {
      const detail = await requestPage(events[0].link, { useProxy });
      const fights = parseEventDetailsHtml(detail.body);
      result.detailStatus = detail.statusCode;
      result.fights = fights.length;
      result.sampleEvent = events[0].title;
      if (saveFixtures) {
        await writeFile(`fixtures/live/${label}-event.html`, detail.body);
      }
    }
    return result;
  } catch (error) {
    return { label, ok: false, durationMs: Date.now() - startedAt, error: error.message };
  }
};

const results = [await diagnose("direct", false)];
if (proxyConfigured) results.push(await diagnose("proxy", true));
else results.push({ label: "proxy", ok: false, error: "PROXY_URL is not configured" });

console.table(results);
if (saveFixtures) console.log("Successful responses saved under fixtures/live/.");
process.exitCode = results.some((result) => result.ok) ? 0 : 1;
