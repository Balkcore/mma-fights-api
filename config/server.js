// config/server.js
console.log("Loaded TRIGGER_KEY:", process.env.TRIGGER_KEY);
import express from "express";
import cors from "cors";
import { scrapeEvents, scrapeEventDetails } from "../utils/scrape.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trigger-key uit .env
const TRIGGER_KEY = process.env.TRIGGER_KEY;

// In-memory cache
let cache = {
  data: [],
  updatedAt: null,
  stats: {
    events: 0,
    eventsWithFights: 0,
  },
};

/**
 * Simple health / data endpoint
 * Geeft de laatst geslaagde scrape terug
 */
app.get("/", (req, res) => {
  res.json({
    data: cache.data,
    updatedAt: cache.updatedAt,
    stats: cache.stats,
  });
});

/**
 * POST /scrape
 * Body: { "key": "...." }
 *
 * - valideert trigger key
 * - draait scrapeEvents + scrapeEventDetails
 * - overschrijft cache alleen als er ≥1 event mét fights is
 */
app.post("/scrape", async (req, res) => {
  try {
    const key = req.body?.key;

    if (!TRIGGER_KEY) {
      console.error("[scrape] TRIGGER_KEY is not configured in environment");
      return res.status(500).json({
        error: true,
        message: "TRIGGER_KEY not configured on server",
      });
    }

    if (key !== TRIGGER_KEY) {
      console.warn("[scrape] invalid trigger key received");
      return res.status(401).json({
        error: true,
        message: "Invalid trigger key",
      });
    }

    console.log("[scrape] triggered");

    // 1) Events uit lijsten halen (MMA + boxing)
    const events = await scrapeEvents();
    const totalEvents = Array.isArray(events) ? events.length : 0;
    console.log("[scrape] events from lists:", totalEvents);

    if (!Array.isArray(events) || totalEvents === 0) {
      console.warn(
        "[scrape] no events found from listings – keeping previous dataset"
      );
      return res.json({
        error: false,
        message:
          "Scrape completed but no events found from listings, previous data kept",
        stats: {
          events: totalEvents,
          eventsWithFights: 0,
        },
        keptPrevious: true,
      });
    }

    // 2) Per event de fight-details ophalen
    const eventsWithFights = await scrapeEventDetails(events);
    const withFightsCount = Array.isArray(eventsWithFights)
      ? eventsWithFights.length
      : 0;

    console.log(
      "[scrape] events=",
      totalEvents,
      "→ withFights=",
      withFightsCount
    );

    if (!withFightsCount) {
      console.warn(
        "[scrape] 0 events with fights – keeping previous dataset (NOT overwriting cache)"
      );
      return res.json({
        error: false,
        message:
          "Scrape completed but found 0 events with fights, previous data kept",
        stats: {
          events: totalEvents,
          eventsWithFights: 0,
        },
        keptPrevious: true,
      });
    }

    // 3) Cache bijwerken (alleen als er minstens 1 event met fights is)
    cache.data = eventsWithFights;
    cache.updatedAt = new Date().toISOString();
    cache.stats = {
      events: totalEvents,
      eventsWithFights: withFightsCount,
    };

    console.log(
      "[scrape] cache updated:",
      withFightsCount,
      "events with fights at",
      cache.updatedAt
    );

    return res.json({
      error: false,
      message: "Scraping and updating completed",
      stats: cache.stats,
      updatedAt: cache.updatedAt,
    });
  } catch (err) {
    console.error("[scrape] fatal error", err);
    return res.status(500).json({
      error: true,
      message: "Error during scraping process",
    });
  }
});

// Export app – index.js doet de listen()
export default app;
