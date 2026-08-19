import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mapWithConcurrency, parseEventDetailsHtml, parseEventsHtml } from "../utils/scrape.js";

test("parses and filters event listings", async () => {
  const html = await readFile("fixtures/events.html", "utf8");
  assert.deepEqual(parseEventsHtml(html, "mma"), [{
    title: "UFC Test",
    date: "Aug 18",
    link: "https://www.tapology.com/fightcenter/events/1-test",
    sport: "mma",
  }]);
});

test("parses a fight card", async () => {
  const html = await readFile("fixtures/event-detail.html", "utf8");
  const fights = parseEventDetailsHtml(html);
  assert.equal(fights.length, 1);
  assert.equal(fights[0].main, true);
  assert.equal(fights[0].weight, "155");
  assert.deepEqual(fights[0].fighterA, {
    name: "Fighter A", record: "10-1",
    country: "https://www.tapology.com/flags/a.png",
    picture: "https://img.example/a.jpg",
    link: "https://www.tapology.com/fighters/a",
  });
  assert.equal(fights[0].fighterB.name, "Fighter B");
});

test("limits concurrent work", async () => {
  let active = 0;
  let maximum = 0;
  const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value * 2;
  });
  assert.equal(maximum, 2);
  assert.deepEqual(result, [2, 4, 6, 8, 10]);
});
