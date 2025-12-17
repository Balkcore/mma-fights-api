import * as cheerio from "cheerio";
import { gotScraping } from "got-scraping";

const baseUrl = "https://www.tapology.com";

// =========================
// Helpers: sleep, mapLimit, retry fetch
// =========================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

const defaultHeaders = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "accept-language": "en-US,en;q=0.9",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
};

function buildRequestOptions(url) {
  const options = { url, headers: defaultHeaders };

  // Proxy consistent gebruiken als hij is gezet
  if (process.env.PROXY_URL && process.env.PROXY_URL.trim() !== "") {
    options.proxyUrl = process.env.PROXY_URL.trim();
  }

  return options;
}

/**
 * Fetch met retries bij 503/429 (en optioneel 520/521/522/524),
 * met exponential backoff + jitter.
 */
async function fetchWithRetry(url, retries = 4) {
  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await gotScraping(buildRequestOptions(url));

    if (res.statusCode === 200) return res;

    const retryable = [429, 503, 520, 521, 522, 524].includes(res.statusCode);

    if (retryable && attempt < retries) {
      const backoff =
        600 * Math.pow(2, attempt) + Math.floor(Math.random() * 500);
      console.warn(
        "[fetchWithRetry] retry",
        attempt + 1,
        "of",
        retries,
        "status=",
        res.statusCode,
        "url=",
        url,
        "wait=",
        backoff,
        "ms"
      );
      await sleep(backoff);
      lastErr = new Error(`Retryable status ${res.statusCode} for ${url}`);
      continue;
    }

    // Niet-retryable of retries op
    throw new Error(`Failed to fetch ${url} (status ${res.statusCode})`);
  }

  throw lastErr ?? new Error(`Failed to fetch ${url}`);
}

// =========================
// Page fetch helper
// =========================
const fetchPage = async (url) => {
  const response = await gotScraping(buildRequestOptions(url));

  if (response.statusCode !== 200) {
    throw new Error(`Failed to scrape ${url} (status ${response.statusCode})`);
  }

  return cheerio.load(response.body);
};

// =========================
// Parse events from FightCenter list page
// =========================
const parseEventsFromDocument = ($, sport) => {
  const events = $(".fightcenterEvents > div")
    .toArray()
    .map((el) => {
      const eventLink = $(el).find(".promotion a").first();
      const href = eventLink.attr("href");

      // debug blijft zoals jij 'm had
      console.log("DEBUG", { title: eventLink.text().trim(), href });

      if (!href) return null;

      const date = $(el).find(".promotion span").eq(3).text().trim();

      return {
        title: eventLink.text().trim(),
        date,
        link: baseUrl + href,
        sport, // mma / boxing
      };
    })
    .filter(Boolean)
    .filter((event) => !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS"));

  return events;
};

// =========================
// Scrape events (lists)
// =========================
const scrapeEvents = async () => {
  try {
    const urls = [
      {
        url: `${baseUrl}/fightcenter?group=major&schedule=upcoming`,
        sport: "mma",
      },
      {
        url: `${baseUrl}/fightcenter?sport=boxing&schedule=upcoming`,
        sport: "boxing",
      },
    ];

    let allEvents = [];

    for (const { url, sport } of urls) {
      try {
        console.log("[scrapeEvents] Fetching:", url, "sport=", sport);
        const $ = await fetchPage(url);
        const events = parseEventsFromDocument($, sport);
        console.log(
          `[scrapeEvents] Found ${events.length} ${sport} events on ${url}`
        );
        allEvents = allEvents.concat(events);
      } catch (err) {
        console.error("[scrapeEvents] Error scraping URL:", url, err.message);
      }
    }

    // Dedup op link
    const seen = new Set();
    const unique = [];
    for (const ev of allEvents) {
      if (!ev?.link) continue;
      if (!seen.has(ev.link)) {
        seen.add(ev.link);
        unique.push(ev);
      }
    }

    console.log(
      `[scrapeEvents] Total unique events (mma+boxing): ${unique.length}`
    );

    return unique;
  } catch (error) {
    console.error("Scraping error (outer):", error);
    throw new Error("Error during scraping: " + error.message);
  }
};

// =========================
// Normalize helpers
// =========================
const normalizeUrl = (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  if (u.startsWith("/")) return baseUrl + u;
  return u;
};

// =========================
// Scrape event details (THROTTLED + RETRIES)
// =========================
const scrapeEventDetails = async (events) => {
  try {
    // 👇 Concurrency limit - tweak 4..6 is usually safe
    const CONCURRENCY = Number(process.env.DETAIL_CONCURRENCY || 5);

    const eventsWithFights = await mapLimit(events, CONCURRENCY, async (event) => {
      if (!event?.link) {
        console.warn("[scrapeEventDetails] Event zonder geldige link, title=", event?.title);
        return null;
      }

      try {
        const eventResponse = await fetchWithRetry(event.link, 4);
        const $ = cheerio.load(eventResponse.body);

        const fights = $('ul[data-event-view-toggle-target="list"] li')
          .toArray()
          .map((el) => {
            const main = $(el)
              .find(
                "a.hover\\:border-solid.hover\\:border-b.hover\\:border-neutral-950.hover\\:text-neutral-950"
              )
              .text()
              .toLowerCase()
              .includes("main");

            const weightRaw = $(el)
              .find(
                "span.px-1\\.5.md\\:px-1.leading-\\[23px\\].text-sm.md\\:text-\\[13px\\].text-neutral-50.rounded"
              )
              .text();

            const weight = (weightRaw || "")
              .replace(/\s+/g, "")
              .trim()
              .substring(0, 3);

            const fighterContainers = $(el).find(
              ".div.flex.flex-row.gap-0\\.5.md\\:gap-0.w-full"
            );

            const fighterAContainer = fighterContainers.eq(0);
            const fighterA = {
              name: fighterAContainer.find(".link-primary-red").text().trim(),
              record: fighterAContainer
                .find(".text-\\[15px\\].md\\:text-xs.order-2")
                .text()
                .trim(),
              country:
                baseUrl +
                (fighterAContainer
                  .find(
                    ".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]"
                  )
                  .attr("src") ?? ""),
              picture: normalizeUrl(
                fighterAContainer
                  .find(
                    ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
                  )
                  .attr("src")
              ),
              link:
                baseUrl +
                (fighterAContainer.find(".link-primary-red").attr("href") ?? ""),
            };

            const fighterBContainer = fighterContainers.eq(1);
            const fighterB = {
              name: fighterBContainer.find(".link-primary-red").text().trim(),
              record: fighterBContainer
                .find(".text-\\[15px\\].md\\:text-xs.order-1")
                .text()
                .trim(),
              country:
                baseUrl +
                (fighterBContainer
                  .find(
                    ".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]"
                  )
                  .attr("src") ?? ""),
              picture: normalizeUrl(
                fighterBContainer
                  .find(
                    ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
                  )
                  .attr("src")
              ),
              link:
                baseUrl +
                (fighterBContainer.find(".link-primary-red").attr("href") ?? ""),
            };

            return { main, weight, fighterA, fighterB };
          });

        if (!fights || fights.length === 0) {
          console.warn("[scrapeEventDetails] Geen fights gevonden voor", event.link);
          return null;
        }

        return { ...event, fights };
      } catch (err) {
        console.error("[scrapeEventDetails] Error bij event", event.link, err.message);
        return null;
      }
    });

    const filtered = eventsWithFights.filter(
      (event) => event && Array.isArray(event.fights) && event.fights.length > 0
    );

    console.log(
      `[scrapeEventDetails] events=${events.length} → withFights=${filtered.length}`
    );

    return filtered;
  } catch (error) {
    console.error("Error during scraping event details (outer):", error);
    throw new Error("Error during scraping event details: " + error.message);
  }
};

export { scrapeEvents, scrapeEventDetails };
