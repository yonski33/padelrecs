// Daily refresh of PadelRecs shop prices (owner 2026-11-26: daily, a plain script, no AI, current price only). Re-reads
// every live padel shop row in padelrecs.creator_prices and updates price, stock, title and checked_at. A page that answers
// 404/410, or now names another year, is hidden (status 'hidden'). A shop that blocks scripts, or a page that fails today,
// is left alone: its row goes stale and the pages hide it after MAX_AGE_DAYS (3). Nothing is worked around.
// Dry run by default; --apply writes. Run by a local scheduled job (deployment/launchd/), never a Claude task.
//   NICHE=padel npx tsx --env-file=.env.local scripts/padel-shop-prices.mts [--apply] [--limit N]
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { PADEL_SHOP_SOURCE, shopNamed } from "../lib/padel-shops";
import { readShopPage, type PageRead } from "../lib/padel-shop-reader";

if (niche.id !== "padel") throw new Error("Run with NICHE=padel.");
const args = process.argv.slice(2), apply = args.includes("--apply");
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const S = niche.schema, PACE_MS = 1200;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const yearsIn = (t: string): string[] => [...(t.match(/\b20\d\d\b/g) ?? [])];

const { client } = connect();
const started = Date.now();
try {
  const rows = (await client.unsafe(`select c.id, c.shop, c.url, c.price, c.in_stock, p.year, p.slug from "${S}".creator_prices c
    join "${S}".rackets p on p.id = c.racket_id where c.status = 'live' and c.source like '${PADEL_SHOP_SOURCE}%' order by c.shop, p.slug`)).slice(0, limit);
  const byHost = new Map<string, typeof rows>();
  for (const r of rows) { const h = new URL(String(r.url)).host; byHost.set(h, [...(byHost.get(h) ?? []), r]); }
  const n = { updated: 0, priceChanged: 0, stockChanged: 0, hidden: 0, blocked: 0, failed: 0 };
  const fails: string[] = [];
  const now = new Date().toISOString();
  await Promise.all([...byHost.values()].map(async list => {
    for (const r of list) {
      const shop = shopNamed(String(r.shop));
      if (!shop) { n.failed++; fails.push(`${r.slug} ${r.url}: unknown shop`); continue; }
      if (shop.read === "blocked") { n.blocked++; continue; }
      await sleep(PACE_MS);
      let page: PageRead = await readShopPage(shop, String(r.url));
      if (!page.ok && /HTTP 429/.test(page.why)) { await sleep(20000); page = await readShopPage(shop, String(r.url)); }
      const wrongYear = page.ok && r.year != null && yearsIn(page.title).length > 0 && !yearsIn(page.title).includes(String(r.year));
      if ((!page.ok && page.gone) || wrongYear) {
        n.hidden++; fails.push(`${r.slug} ${r.url}: hidden (${page.ok ? `page now says ${page.title}` : page.why})`);
        if (apply) await client.unsafe(`update "${S}".creator_prices set status = 'hidden' where id = $1`, [r.id]);
        continue;
      }
      if (!page.ok) { n.failed++; fails.push(`${r.slug} ${r.url}: ${page.why}`); continue; }
      if (page.currency && page.currency !== shop.currency) { n.failed++; fails.push(`${r.slug} ${r.url}: currency ${page.currency}`); continue; }
      n.updated++;
      if (Math.abs(page.price - Number(r.price)) >= 0.01) n.priceChanged++;
      if (page.inStock !== (r.in_stock === true)) n.stockChanged++;
      if (apply) await client.unsafe(`update "${S}".creator_prices set price = $2, in_stock = $3, listing_title = $4, checked_at = $5 where id = $1`,
        [r.id, page.price, page.inStock, page.title, now]);
    }
  }));
  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`${now} padel shop prices${apply ? "" : " (dry run)"}: ${rows.length} rows, ${n.updated} read (${n.priceChanged} price, ${n.stockChanged} stock changes), ${n.hidden} hidden, ${n.blocked} blocked shop (left to go stale), ${n.failed} failed, ${mins} min`);
  for (const f of fails.slice(0, 40)) console.log(`  ${f}`);
  if (fails.length > 40) console.log(`  ... ${fails.length - 40} more`);
} finally { await client.end(); }
