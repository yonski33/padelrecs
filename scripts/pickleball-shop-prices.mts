// Daily refresh of PickleballRecs shop prices (owner 2026-11-26: "get daily prices for all paddles with the script"; no AI,
// current price only, no history). Re-reads every live non-Amazon row in pickleballrecs.creator_prices (Amazon has its own
// daily job, scripts/amazon-prices.mts) and updates price, stock, title and checked_at. A page that answers 404/410 is hidden
// (status 'hidden'). A shop that rate-limits or blocks scripts, or a page that fails today, is left alone: its row goes stale
// and the pages hide it after 3 days (db/creator-reviews.ts SHOP_MAX_AGE_MS). Nothing is worked around.
// USD only (2026-11-27 fix, lib/pickleball-price-reader.ts): every shop's product page is read pinned to the US market
// (?country=US&currency=USD); price and currency come from its schema.org Product offer. A page that does not state USD, or a
// price more than 2.5x the paddle's other offers (or above $1,000 with none), is rejected and the row is left alone.
// Dry run by default; --apply writes. Run by a local scheduled job (deployment/launchd/), never a Claude task.
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/pickleball-shop-prices.mts [--apply] [--limit N]
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { UA } from "../lib/padel-shop-reader";
import { plausible, usdOffer, usdUrl } from "../lib/pickleball-price-reader";

if (niche.id !== "pickleball") throw new Error("Run with NICHE=pickleball.");
const args = process.argv.slice(2), apply = args.includes("--apply");
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const S = niche.schema, PACE_MS = 1500;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const headers = { ...UA, "user-agent": "PickleballRecsPriceCheck/1.0 (+https://www.pickleballrecs.com)" };

type Read = { ok: true; title: string; price: number; inStock: boolean } | { ok: false; gone: boolean; why: string };
async function read(url: string): Promise<Read> {
  let res: Response;
  try { res = await fetch(usdUrl(url), { headers, redirect: "follow", signal: AbortSignal.timeout(20000) }); }
  catch (e) { return { ok: false, gone: false, why: `fetch failed: ${String(e instanceof Error ? e.message : e).slice(0, 100)}` }; }
  if (res.status !== 200) return { ok: false, gone: res.status === 404 || res.status === 410, why: `HTTP ${res.status}` };
  const p = usdOffer(await res.text());
  return p.ok ? p : { ok: false, gone: false, why: p.why };
}

const { client } = connect();
const started = Date.now();
try {
  const all = await client.unsafe(`select c.id, c.racket_id, c.shop, c.url, c.price::float price, c.in_stock, p.slug from "${S}".creator_prices c
    join "${S}".rackets p on p.id = c.racket_id where c.status = 'live' order by c.shop, p.slug`);
  const offers = new Map<string, { id: string; price: number }[]>();
  for (const r of all) offers.set(r.racket_id, [...(offers.get(r.racket_id) ?? []), { id: r.id, price: Number(r.price) }]);
  const rows = all.filter(r => r.shop !== "Amazon").slice(0, limit);
  const byHost = new Map<string, typeof rows>();
  for (const r of rows) { const h = new URL(String(r.url)).host; byHost.set(h, [...(byHost.get(h) ?? []), r]); }
  const n = { updated: 0, priceChanged: 0, stockChanged: 0, hidden: 0, failed: 0, rejected: 0 };
  const fails: string[] = [];
  const now = new Date().toISOString();
  await Promise.all([...byHost.values()].map(async list => {
    for (const r of list) {
      await sleep(PACE_MS);
      const url = String(r.url);
      let page = await read(url);
      if (!page.ok && /HTTP 429/.test(page.why)) { await sleep(20000); page = await read(url); }
      if (!page.ok && page.gone) {
        n.hidden++; fails.push(`${r.slug} ${url}: hidden (${page.why})`);
        if (apply) await client.unsafe(`update "${S}".creator_prices set status = 'hidden' where id = $1`, [r.id]);
        continue;
      }
      if (!page.ok) { n.failed++; fails.push(`${r.slug} ${url}: ${page.why}`); continue; }
      const others = (offers.get(r.racket_id) ?? []).filter(o => o.id !== r.id).map(o => o.price);
      const sane = plausible(page.price, others);
      if (!sane.ok) { n.rejected++; fails.push(`${r.slug} ${url}: rejected, ${sane.why}`); continue; }
      n.updated++;
      if (Math.abs(page.price - Number(r.price)) >= 0.01) n.priceChanged++;
      if (page.inStock !== (r.in_stock === true)) n.stockChanged++;
      if (apply) await client.unsafe(`update "${S}".creator_prices set price = $2, in_stock = $3, listing_title = $4, checked_at = $5 where id = $1`,
        [r.id, page.price, page.inStock, page.title, now]);
    }
  }));
  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`${now} pickleball shop prices${apply ? "" : " (dry run)"}: ${rows.length} rows, ${n.updated} read (${n.priceChanged} price, ${n.stockChanged} stock changes), ${n.rejected} rejected (not USD or implausible), ${n.hidden} hidden, ${n.failed} failed (left to go stale), ${mins} min`);
  for (const f of fails.slice(0, 60)) console.log(`  ${f}`);
  if (fails.length > 60) console.log(`  ... ${fails.length - 60} more`);
} finally { await client.end(); }
