// // import * as cheerio from "cheerio";
// // import { gotScraping } from "got-scraping";

// // const baseUrl = "https://www.tapology.com";

// // const scrapeEvents = async () => {
// // 	try {
// // 		const response = await gotScraping({
// // 			url: `${baseUrl}/fightcenter?group=major&schedule=upcoming`,
// // 			proxyUrl: process.env.PROXY_URL,
// // 		});

// // 		if (response.statusCode !== 200) {
// // 			throw new Error("Failed to scrape data from Tapology");
// // 		}

// // 		const $ = cheerio.load(response.body);

// // 		const majorOrgs = ["UFC", "PFL", "BELLATOR", "ONE", "RIZIN"];

// // 		const events = $(".fightcenterEvents > div")
// // 			.toArray()
// // 			.map((el) => {
// // 				const eventLink = $(el).find(".promotion a");
// // 				const date = $(el).find(".promotion span").eq(3).text().trim();
// // 				return {
// // 					title: eventLink.first().text().trim(),
// // 					date,
// // 					link: baseUrl + eventLink.first().attr("href"),
// // 				};
// // 			})
// // 			// .filter((event) => majorOrgs.some((org) => event.title.toUpperCase().includes(org)) && !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS"))
// // 			.filter((event) => !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS"));
// // 			// .slice(0, 10); // Limit to 10 events

// // 		return events;
// // 	} catch (error) {
// // 		console.error("Scraping error:", error);
// // 		throw new Error("Error during scraping: ", error);
// // 	}
// // };

// // const scrapeEvents = async () => {
// //     try {
// //         const response = await gotScraping({
// //             url: `${baseUrl}/fightcenter?group=major&schedule=upcoming`,
// //             proxyUrl: process.env.PROXY_URL,
// //         });

// //         if (response.statusCode !== 200) {
// //             throw new Error("Failed to scrape data from Tapology");
// //         }

// //         const $ = cheerio.load(response.body);

// //         const events = $(".fightcenterEvents > div")
// //             .toArray()
// //             .map((el) => {
// //                 const eventLink = $(el).find(".promotion a").first();
// //                 const href = eventLink.attr("href"); // <-- critical

// //                 // ❌ Geen href = geen geldig event blok
// //                 if (!href) {
// //                     return null;
// //                 }

// //                 const date = $(el).find(".promotion span").eq(3).text().trim();

// //                 return {
// //                     title: eventLink.text().trim(),
// //                     date,
// //                     link: baseUrl + href,
// //                 };
// //             })
// //             // ❌ Null items eruit halen
// //             .filter((ev) => ev !== null)

// //             // ❌ ONE Friday Fights behalve laten
// //             .filter((event) => !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS"));

// //             // Optional: limit
// //             // .slice(0, 30);

// //         return events;
// //     } catch (error) {
// //         console.error("Scraping error:", error);
// //         throw new Error("Error during scraping: " + error.message);
// //     }
// // };

// // import * as cheerio from "cheerio";
// // import { gotScraping } from "got-scraping";

// // const baseUrl = "https://www.tapology.com";

// // /**
// //  * Helper: gotScraping met optionele proxy
// //  */
// // const fetchWithOptionalProxy = async (url) => {
// //     const options = { url };

// //     if (process.env.PROXY_URL) {
// //         options.proxyUrl = process.env.PROXY_URL;
// //     }

// //     return gotScraping(options);
// // };

// // /**
// //  * Helper: parse de standaard Fightcenter event-lijst
// //  * (werkt voor group=major én group=boxing)
// //  */
// // const parseEventsFromHtml = (html) => {
// //     const $ = cheerio.load(html);

// //     const events = $(".fightcenterEvents > div")
// //         .toArray()
// //         .map((el) => {
// //             const eventLink = $(el).find(".promotion a").first();
// //             const href = eventLink.attr("href");

// //             if (!href) {
// //                 return null;
// //             }

// //             const date = $(el).find(".promotion span").eq(3).text().trim();

// //             return {
// //                 title: eventLink.text().trim(),
// //                 date,
// //                 link: baseUrl + href,
// //             };
// //         })
// //         .filter((ev) => ev !== null)
// //         // ONE FRIDAY FIGHTS eruit
// //         .filter(
// //             (event) =>
// //                 !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS")
// //         );

// //     return events;
// // };

// // /**
// //  * Haal upcoming events op voor:
// //  * - group=major  (MMA / grote orgs)
// //  * - group=boxing (grote boxing cards)
// //  */
// // const scrapeEvents = async () => {
// //     try {
// //         const groups = ["major", "boxing"];

// //         const responses = await Promise.all(
// //             groups.map((group) =>
// //                 fetchWithOptionalProxy(
// //                     `${baseUrl}/fightcenter?group=${group}&schedule=upcoming`
// //                 )
// //             )
// //         );

// //         const allEvents = [];

// //         responses.forEach((response, idx) => {
// //             if (response.statusCode !== 200) {
// //                 console.error(
// //                     `Failed to scrape data from Tapology (group=${groups[idx]}), status:`,
// //                     response.statusCode
// //                 );
// //                 return;
// //             }

// //             const events = parseEventsFromHtml(response.body);
// //             allEvents.push(...events);
// //         });

// //         // Dedup: zelfde event-link maar 1x
// //         const byLink = new Map();
// //         for (const ev of allEvents) {
// //             if (!ev || !ev.link) continue;
// //             if (!byLink.has(ev.link)) {
// //                 byLink.set(ev.link, ev);
// //             }
// //         }

// //         const uniqueEvents = Array.from(byLink.values());
// //         console.log(
// //             `scrapeEvents -> groups=[${groups.join(
// //                 ","
// //             )}] total=${uniqueEvents.length}`
// //         );

// //         return uniqueEvents;
// //     } catch (error) {
// //         console.error("Scraping error in scrapeEvents:", error);
// //         throw new Error("Error during scraping: " + error.message);
// //     }
// // };

// // export { scrapeEvents, scrapeEventDetails };

// import * as cheerio from "cheerio";
// import { gotScraping } from "got-scraping";

// const baseUrl = "https://www.tapology.com";

// /**
//  * Kleine helper: haal een pagina op, met optionele proxy
//  */
// const fetchPage = async (url) => {
//   const options = { url };

//   // Alleen proxy meesturen als er echt een geldige URL staat
//   if (process.env.PROXY_URL && process.env.PROXY_URL.trim() !== "") {
//     options.proxyUrl = process.env.PROXY_URL;
//   }

//   const response = await gotScraping(options);

//   if (response.statusCode !== 200) {
//     throw new Error(`Failed to scrape ${url} (status ${response.statusCode})`);
//   }

//   return cheerio.load(response.body);
// };

// /**
//  * Parse de events uit één FightCenter-pagina
//  */
// // const parseEventsFromDocument = ($) => {
// //   return $(".fightcenterEvents > div")
// //     .toArray()
// //     .map((el) => {
// //       const eventLink = $(el).find(".promotion a").first();
// //       const href = eventLink.attr("href");

// //       // geen href = geen geldig event-blok
// //       if (!href) {
// //         return null;
// //       }

// //       const date = $(el).find(".promotion span").eq(3).text().trim();

// //       return {
// //         title: eventLink.text().trim(),
// //         date,
// //         link: baseUrl + href,
// //       };
// //     })
// //     .filter((ev) => ev !== null)
// //     // ONE Friday Fights desnoods eruit filteren
// //     .filter((event) => !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS"));
// // };

// const parseEventsFromDocument = ($, sport) => {
//   return $(".fightcenterEvents > div")
//     .toArray()
//     .map((el) => {
//       const eventLink = $(el).find(".promotion a").first();
//       const href = eventLink.attr("href");

//       if (!href) {
//         return null;
//       }

//       const date = $(el).find(".promotion span").eq(3).text().trim();

//       return {
//         title: eventLink.text().trim(),
//         date,
//         link: baseUrl + href,
//         sport, // 👈 hieraan zie je later mma vs boxing
//       };
//     })
//     .filter((ev) => ev !== null)
//     .filter((event) => !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS"));
// };


// /**
//  * Haal events op van:
//  *  - major MMA orgs
//  *  - boxing
//  */
// const scrapeEvents = async () => {
//   try {
//     // const urls = [
//     //   `${baseUrl}/fightcenter?group=major&schedule=upcoming`,   // MMA major
//     //   `${baseUrl}/fightcenter?sport=boxing&schedule=upcoming`, // Boxing
//     // ];

// 	const SOURCES = [
// 	{
// 		url: `${baseUrl}/fightcenter?group=major&schedule=upcoming`,
// 		sport: "mma",
// 	},
// 	{
// 		url: `${baseUrl}/fightcenter?sport=boxing&schedule=upcoming`,
// 		sport: "boxing",
// 	},
// 	];

//     let allEvents = [];

//     // for (const url of urls) {
//     //   try {
//     //     console.log("[scrapeEvents] Fetching:", url);
//     //     const $ = await fetchPage(url);
//     //     const events = parseEventsFromDocument($);
//     //     console.log(`[scrapeEvents] Found ${events.length} events on ${url}`);
//     //     allEvents = allEvents.concat(events);
//     //   } catch (err) {
//     //     console.error("[scrapeEvents] Error scraping URL:", url, err.message);
//     //     // We gaan NIET throwen hier, zodat een fout in boxing niet de hele scrape sloopt
//     //   }
//     // }

// 	const scrapeEvents = async () => {
//   try {
//     let allEvents = [];

//     for (const src of SOURCES) {
//       const { url, sport } = src;

//       try {
//         console.log("[scrapeEvents] Fetching:", url, "sport:", sport);
//         const $ = await fetchPage(url);
//         const events = parseEventsFromDocument($, sport);
//         console.log(
//           `[scrapeEvents] Found ${events.length} events on ${url} (sport=${sport})`
//         );
//         allEvents = allEvents.concat(events);
//       } catch (err) {
//         console.error(
//           "[scrapeEvents] Error scraping URL:",
//           url,
//           "sport:",
//           sport,
//           err.message
//         );
//       }
//     }

//     const seen = new Set();
//     const unique = [];
//     for (const ev of allEvents) {
//       if (!seen.has(ev.link)) {
//         seen.add(ev.link);
//         unique.push(ev);
//       }
//     }

//     return unique;
//   } catch (error) {
//     console.error("Scraping error (outer):", error);
//     throw new Error("Error during scraping: " + error.message);
//   }
// };


//     // Dubbels eruit op basis van link
//     const seen = new Set();
//     const unique = [];
//     for (const ev of allEvents) {
//       if (!seen.has(ev.link)) {
//         seen.add(ev.link);
//         unique.push(ev);
//       }
//     }

//     return unique;
//   } catch (error) {
//     console.error("Scraping error (outer):", error);
//     throw new Error("Error during scraping: " + error.message);
//   }
// };

// // export { scrapeEvents, scrapeEventDetails };


// // const scrapeEventDetails = async (events) => {
// // 	try {
// // 		const eventsWithFights = await Promise.all(
// // 			events.map(async (event) => {
// // 				const eventResponse = await gotScraping({
// // 					url: event.link,
// // 				});

// // 				if (eventResponse.statusCode !== 200) {
// // 					throw new Error("Failed to fetch for: ", event.link);
// // 				}

// // 				const $ = cheerio.load(eventResponse.body);

// // 				const fights = $('ul[data-event-view-toggle-target="list"] li')
// // 					.toArray()
// // 					.map((el) => {
// // 						const main = $(el)
// // 							.find("a.hover\\:border-solid.hover\\:border-b.hover\\:border-neutral-950.hover\\:text-neutral-950")
// // 							.text()
// // 							.toLowerCase()
// // 							.includes("main");

// // 						const weight = $(el)
// // 							.find("span.px-1\\.5.md\\:px-1.leading-\\[23px\\].text-sm.md\\:text-\\[13px\\].text-neutral-50.rounded")
// // 							.text()
// // 							.trim()
// // 							.substring(0, 3);

// // 						const fighterContainers = $(el).find(".div.flex.flex-row.gap-0\\.5.md\\:gap-0.w-full");

// // 						const fighterAContainer = fighterContainers.eq(0);
// // 						const fighterA = {
// // 							name: fighterAContainer.find(".link-primary-red").text().trim(),
// // 							record: fighterAContainer.find(".text-\\[15px\\].md\\:text-xs.order-2").text().trim(),
// // 							country: baseUrl + fighterAContainer.find(".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]").attr("src"),
// // 							picture: fighterAContainer.find(".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded").attr("src"),
// // 							link: baseUrl + fighterAContainer.find(".link-primary-red").attr("href"),
// // 						};

// // 						const fighterBContainer = fighterContainers.eq(1);
// // 						const fighterB = {
// // 							name: fighterBContainer.find(".link-primary-red").text().trim(),
// // 							record: fighterBContainer.find(".text-\\[15px\\].md\\:text-xs.order-1").text().trim(),
// // 							country: baseUrl + fighterBContainer.find(".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]").attr("src"),
// // 							picture: fighterBContainer.find(".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded").attr("src"),
// // 							link: baseUrl + fighterBContainer.find(".link-primary-red").attr("href"),
// // 						};

// // 						return { main, weight, fighterA, fighterB };
// // 					});

// // 				event.fights = fights;
// // 				return event;
// // 			})
// // 		);

// // 		return eventsWithFights.filter((event) => event.fights.length > 0);
// // 	} catch (error) {
// // 		console.error("Error during scraping event details:", error);
// // 		throw new Error("Error during scraping event details:", error);
// // 	}
// // };

// const scrapeEventDetails = async (events) => {
//   try {
//     const eventsWithFights = await Promise.all(
//       events.map(async (event) => {
//         // Geen geldige link? Skip dit event
//         if (!event || !event.link) {
//           console.warn(
//             "[scrapeEventDetails] Event zonder geldige link, title=",
//             event?.title
//           );
//           return null;
//         }

//         try {
//           const eventResponse = await gotScraping({
//             url: event.link,
//           });

//           if (eventResponse.statusCode !== 200) {
//             console.error(
//               "[scrapeEventDetails] Failed to fetch",
//               event.link,
//               "status=",
//               eventResponse.statusCode
//             );
//             return null; // skip dit event
//           }

//           const $ = cheerio.load(eventResponse.body);

//           const fights = $('ul[data-event-view-toggle-target="list"] li')
//             .toArray()
//             .map((el) => {
//               const main = $(el)
//                 .find(
//                   "a.hover\\:border-solid.hover\\:border-b.hover\\:border-neutral-950.hover\\:text-neutral-950"
//                 )
//                 .text()
//                 .toLowerCase()
//                 .includes("main");

//               const weight = $(el)
//                 .find(
//                   "span.px-1\\.5.md\\:px-1.leading-\\[23px\\].text-sm.md\\:text-\\[13px\\].text-neutral-50.rounded"
//                 )
//                 .text()
//                 .trim()
//                 .substring(0, 3);

//               const fighterContainers = $(el).find(
//                 ".div.flex.flex-row.gap-0\\.5.md\\:gap-0.w-full"
//               );

//               const fighterAContainer = fighterContainers.eq(0);
//               const fighterA = {
//                 name: fighterAContainer
//                   .find(".link-primary-red")
//                   .text()
//                   .trim(),
//                 record: fighterAContainer
//                   .find(".text-\\[15px\\].md\\:text-xs.order-2")
//                   .text()
//                   .trim(),
//                 country:
//                   baseUrl +
//                   fighterAContainer
//                     .find(
//                       ".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]"
//                     )
//                     .attr("src"),
//                 picture: fighterAContainer
//                   .find(
//                     ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
//                   )
//                   .attr("src"),
//                 link:
//                   baseUrl +
//                   fighterAContainer
//                     .find(".link-primary-red")
//                     .attr("href"),
//               };

//               const fighterBContainer = fighterContainers.eq(1);
//               const fighterB = {
//                 name: fighterBContainer
//                   .find(".link-primary-red")
//                   .text()
//                   .trim(),
//                 record: fighterBContainer
//                   .find(".text-\\[15px\\].md\\:text-xs.order-1")
//                   .text()
//                   .trim(),
//                 country:
//                   baseUrl +
//                   fighterBContainer
//                     .find(
//                       ".opacity-70.h-\\[14px\\].md\\:h-\\[11px\\].w-\\[22px\\].md\\:w-\\[17px\\]"
//                     )
//                     .attr("src"),
//                 picture: fighterBContainer
//                   .find(
//                     ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
//                   )
//                   .attr("src"),
//                 link:
//                   baseUrl +
//                   fighterBContainer
//                     .find(".link-primary-red")
//                     .attr("href"),
//               };

//               return { main, weight, fighterA, fighterB };
//             });

//           // Geen fights gevonden? Vind ik verdacht -> skip
//           if (!fights || fights.length === 0) {
//             console.warn(
//               "[scrapeEventDetails] Geen fights gevonden voor",
//               event.link
//             );
//             return null;
//           }

//           // Voeg fights toe aan event
//           return { ...event, fights };
//         } catch (err) {
//           console.error(
//             "[scrapeEventDetails] Error bij event",
//             event.link,
//             err.message
//           );
//           return null;
//         }
//       })
//     );

//     // nulls eruit filteren + alleen events met fights
//     return eventsWithFights.filter(
//       (event) => event && Array.isArray(event.fights) && event.fights.length > 0
//     );
//   } catch (error) {
//     console.error("Error during scraping event details (outer):", error);
//     throw new Error("Error during scraping event details: " + error.message);
//   }
// };


// export { scrapeEvents, scrapeEventDetails };

import * as cheerio from "cheerio";
import { gotScraping } from "got-scraping";

const baseUrl = "https://www.tapology.com";

/**
 * Kleine helper: haal een pagina op, met optionele proxy
 */
const fetchPage = async (url) => {
  const options = { url };

  // Alleen proxy meesturen als er echt een geldige URL staat
  if (process.env.PROXY_URL && process.env.PROXY_URL.trim() !== "") {
    options.proxyUrl = process.env.PROXY_URL;
  }

  const response = await gotScraping(options);

  if (response.statusCode !== 200) {
    throw new Error(`Failed to scrape ${url} (status ${response.statusCode})`);
  }

  return cheerio.load(response.body);
};

/**
 * Parse de events uit één FightCenter-pagina
 * sport = 'mma' of 'boxing'
 */
const parseEventsFromDocument = ($, sport) => {
  const events = $(".fightcenterEvents > div")
    .toArray()
    .map((el) => {
      const eventLink = $(el).find(".promotion a").first();
      const href = eventLink.attr("href");

      if (!href) {
        return null;
      }

      const date = $(el).find(".promotion span").eq(3).text().trim();

      return {
        title: eventLink.text().trim(),
        date,
        link: baseUrl + href,
        sport, // 👈 belangrijk voor later (mma / boxing)
      };
    })
    .filter((ev) => ev !== null)
    .filter(
      (event) => !event.title.toUpperCase().includes("ONE FRIDAY FIGHTS")
    );

  return events;
};

/**
 * Haal events op van:
 *  - major (MMA)
 *  - boxing (boxing)
 */
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

    // Dubbels eruit op basis van link
    const seen = new Set();
    const unique = [];
    for (const ev of allEvents) {
      if (!ev || !ev.link) continue;
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

/**
 * Haal fights per event op
 */
const scrapeEventDetails = async (events) => {
  try {
    const eventsWithFights = await Promise.all(
      events.map(async (event) => {
        if (!event || !event.link) {
          console.warn(
            "[scrapeEventDetails] Event zonder geldige link, title=",
            event?.title
          );
          return null;
        }

        try {
          const eventResponse = await gotScraping({
            url: event.link,
          });

          if (eventResponse.statusCode !== 200) {
            console.error(
              "[scrapeEventDetails] Failed to fetch",
              event.link,
              "status=",
              eventResponse.statusCode
            );
            return null;
          }

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

              const weight = $(el)
                .find(
                  "span.px-1\\.5.md\\:px-1.leading-\\[23px\\].text-sm.md\\:text-\\[13px\\].text-neutral-50.rounded"
                )
                .text()
                .trim()
                .substring(0, 3);

              const fighterContainers = $(el).find(
                ".div.flex.flex-row.gap-0\\.5.md\\:gap-0.w-full"
              );

              const fighterAContainer = fighterContainers.eq(0);
              const fighterA = {
                name: fighterAContainer
                  .find(".link-primary-red")
                  .text()
                  .trim(),
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
                picture: fighterAContainer
                  .find(
                    ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
                  )
                  .attr("src"),
                link:
                  baseUrl +
                  (fighterAContainer.find(".link-primary-red").attr("href") ??
                    ""),
              };

              const fighterBContainer = fighterContainers.eq(1);
              const fighterB = {
                name: fighterBContainer
                  .find(".link-primary-red")
                  .text()
                  .trim(),
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
                picture: fighterBContainer
                  .find(
                    ".w-\\[77px\\].h-\\[77px\\].md\\:w-\\[104px\\].md\\:h-\\[104px\\].rounded"
                  )
                  .attr("src"),
                link:
                  baseUrl +
                  (fighterBContainer.find(".link-primary-red").attr("href") ??
                    ""),
              };

              return { main, weight, fighterA, fighterB };
            });

          if (!fights || fights.length === 0) {
            console.warn(
              "[scrapeEventDetails] Geen fights gevonden voor",
              event.link
            );
            return null;
          }

          return { ...event, fights };
        } catch (err) {
          console.error(
            "[scrapeEventDetails] Error bij event",
            event.link,
            err.message
          );
          return null;
        }
      })
    );

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
