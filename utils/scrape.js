import * as cheerio from "cheerio";
import { gotScraping } from "got-scraping";

const baseUrl = "https://www.tapology.com";
const positiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const absoluteUrl = (value) => {
  if (!value) return "";
  try { return new URL(value, baseUrl).href; } catch { return ""; }
};

const requestPage = async (url, { useProxy = true } = {}) => {
  const proxyUrl = process.env.PROXY_URL?.trim();
  const options = {
    url,
    throwHttpErrors: false,
    timeout: { request: positiveInteger(process.env.SCRAPE_TIMEOUT_MS, 20_000) },
    retry: {
      limit: positiveInteger(process.env.SCRAPE_RETRIES, 2),
      methods: ["GET"],
    },
  };
  if (useProxy && proxyUrl) options.proxyUrl = proxyUrl;

  const response = await gotScraping(options);
  if (response.statusCode !== 200) {
    throw new Error(`Failed to scrape ${url} (status ${response.statusCode})`);
  }
  return response;
};

const parseEventsHtml = (html, sport) => {
  const $ = cheerio.load(html);
  return $(".fightcenterEvents > div")
    .toArray()
    .map((element) => {
      const eventLink = $(element).find(".promotion a").first();
      const href = eventLink.attr("href");
      if (!href) return null;
      return {
        title: eventLink.text().trim(),
        date: $(element).find(".promotion span").eq(3).text().trim(),
        link: absoluteUrl(href),
        sport,
      };
    })
    .filter(Boolean)
    .filter((event) => !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS"));
};

const fighterFromContainer = (container, recordOrder) => ({
  name: container.find(".link-primary-red").text().trim(),
  record: container
    .find(`.text-\\[15px\\].md\\:text-xs.order-${recordOrder}`)
    .text()
    .trim(),
  country: absoluteUrl(
    container.find(".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]").attr("src")
  ),
  picture: absoluteUrl(
    container.find(".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded").attr("src")
  ),
  link: absoluteUrl(container.find(".link-primary-red").attr("href")),
});

const parseEventDetailsHtml = (html) => {
  const $ = cheerio.load(html);
  return $('ul[data-event-view-toggle-target="list"] li')
    .toArray()
    .map((element) => {
      const item = $(element);
      const fighterContainers = item.find(".div.flex.flex-row.gap-0\\.5.md\\:gap-0.w-full");
      return {
        main: item
          .find("a.hover\\:border-solid.hover\\:border-b.hover\\:border-neutral-950.hover\\:text-neutral-950")
          .text().toLowerCase().includes("main"),
        weight: item
          .find("span.px-1\\.5.md\\:px-1.leading-\\[23px\\].text-sm.md\\:text-\\[13px\\].text-neutral-50.rounded")
          .text().trim().substring(0, 3),
        fighterA: fighterFromContainer(fighterContainers.eq(0), 2),
        fighterB: fighterFromContainer(fighterContainers.eq(1), 1),
      };
    });
};

const mapWithConcurrency = async (items, limit, mapper) => {
  const results = new Array(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

const scrapeEvents = async () => {
  const sources = [
    { url: `${baseUrl}/fightcenter?group=major&schedule=upcoming`, sport: "mma" },
    { url: `${baseUrl}/fightcenter?sport=boxing&schedule=upcoming`, sport: "boxing" },
  ];
  const allEvents = [];

  for (const { url, sport } of sources) {
    try {
      console.log("[scrapeEvents] Fetching:", url, "sport=", sport);
      const response = await requestPage(url);
      const events = parseEventsHtml(response.body, sport);
      console.log(`[scrapeEvents] Found ${events.length} ${sport} events`);
      allEvents.push(...events);
    } catch (error) {
      console.error("[scrapeEvents] Error scraping URL:", url, error.message);
    }
  }
  return [...new Map(allEvents.map((event) => [event.link, event])).values()];
};

const scrapeEventDetails = async (events) => {
  const concurrency = positiveInteger(process.env.SCRAPE_CONCURRENCY, 4);
  const results = await mapWithConcurrency(events, concurrency, async (event) => {
    if (!event?.link) return null;
    try {
      const response = await requestPage(event.link);
      const fights = parseEventDetailsHtml(response.body);
      if (fights.length === 0) {
        console.warn("[scrapeEventDetails] No fights found for", event.link);
        return null;
      }
      return { ...event, fights };
    } catch (error) {
      console.error("[scrapeEventDetails] Error for", event.link, error.message);
      return null;
    }
  });
  return results.filter(Boolean);
};

export {
  baseUrl,
  mapWithConcurrency,
  parseEventDetailsHtml,
  parseEventsHtml,
  requestPage,
  scrapeEventDetails,
  scrapeEvents,
};
