// Weekly refresh of NINEPADEL's rows in db/shop/padel-offers.json (the "Where to buy" box on PadelRecs racket pages) from
// NINEPADEL's public product feed. No keys, no database: it reads the feed, matches each stored NINEPADEL row by its
// product URL, and updates price (the feed's price_now), stock and the check date. A row whose product left the feed is
// dropped (its page may be gone). Trade-only URLs (/products/trade-...) are never kept. Dry run by default.
//   npx tsx scripts/ninepadel-feed.mts            # report only
//   npx tsx scripts/ninepadel-feed.mts --apply    # write db/shop/padel-offers.json, then commit it with [site padel]
// Run weekly (no cron yet: vercel.json is left alone until the owner OKs one). Feed: https://ninepadel.com/affiliate-feed.json
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { refreshFromFeed, type NineFeed } from "../lib/ninepadel-feed";
import type { OffersFile } from "../lib/padel-offers";

const FEED = "https://ninepadel.com/affiliate-feed.json";
const FILE = fileURLToPath(new URL("../db/shop/padel-offers.json", import.meta.url));
const apply = process.argv.includes("--apply");

const res = await fetch(FEED, { redirect: "follow", headers: { accept: "application/json" } });
if (!res.ok) throw new Error(`NINEPADEL feed: HTTP ${res.status}`);
const feed = await res.json() as NineFeed;
const file = JSON.parse(await readFile(FILE, "utf8")) as OffersFile;
const today = new Date().toISOString().slice(0, 10);
const { next, report } = refreshFromFeed(file, feed, today);

console.log(`Feed built ${feed.built ?? "?"}, ${feed.items?.length ?? 0} items, ${report.feedRackets} padel rackets.`);
console.log(`NINEPADEL rows: ${report.updated} updated (${report.priceChanged} price changes, ${report.stockChanged} stock changes), ${report.dropped.length} dropped.`);
for (const d of report.dropped) console.log(`  dropped ${d.slug}: ${d.url} (${d.why})`);
console.log(`${report.unlinked} feed rackets are not linked to any PadelRecs racket yet (match new ones by hand, model and year exact).`);
if (apply) { await writeFile(FILE, `${JSON.stringify(next, null, 1)}\n`); console.log(`Wrote ${FILE}`); }
else console.log("Dry run: nothing written (add --apply).");
