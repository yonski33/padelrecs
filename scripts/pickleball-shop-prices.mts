// Daily refresh of PickleballRecs shop prices (owner 2026-11-26: "get daily prices for all paddles with the script"; no AI,
// current price only, no history). Re-reads every live non-Amazon row in pickleballrecs.creator_prices (Amazon has its own
// daily job, scripts/amazon-prices.mts) and updates price, stock, title and checked_at. A page that answers 404/410 is hidden
// (status 'hidden'). A shop that rate-limits or blocks scripts, or a page that fails today, is left alone: its row goes stale
// and the pages hide it after 3 days (db/creator-reviews.ts SHOP_MAX_AGE_MS). Nothing is worked around.
// USD only (2026-11-27 fix, lib/pickleball-price-reader.ts): every page is read pinned to the US market
// (?country=US&currency=USD) from a source that states its currency: JSON-LD, price meta tags, Shopify page globals (rate
// 1.0 only), then Shopify's /products/<handle>.json (variant price_currency). Only a USD price is kept, and a price more than
// 2.5x the paddle's other offers (or above $1,000 with none) is rejected; the row is then left alone. Stock comes from the
// source, or Shopify's .js, else stays as it is. One request per 2.5s per host (hosts in parallel); a 429 waits for
// Retry-After (else 15/30/60s backoff) up to 3 times and never falls back to .json. The run ends with a count per failure
// reason and the full failure list.
// Dry run by default; --apply writes. Run by a local scheduled job (deployment/launchd/), never a Claude task.
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/pickleball-shop-prices.mts [--apply] [--limit N]
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { UA } from "../lib/padel-shop-reader";
import { fromShopifyJson, plausible, shopifyJsonUrl, stockFromShopifyJs, usd, usdOffer, usdUrl } from "../lib/pickleball-price-reader";

if (niche.id !== "pickleball") throw new Error("Run with NICHE=pickleball.");
const args = process.argv.slice(2), apply = args.includes("--apply");
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const S = niche.schema, HOST_GAP_MS = 2500, RETRIES = 3, MAX_WAIT_MS = 120000;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const headers = { ...UA, "user-agent": "PickleballRecsPriceCheck/1.0 (+https://www.pickleballrecs.com)" };

type Read = { ok: true; source: string; title: string; price: number; inStock: boolean | null } | { ok: false; gone: boolean; why: string };
// Per-host pacing: at most one request every HOST_GAP_MS to the same host (hosts run in parallel). A 429 waits for the
// shop's Retry-After (seconds or a date), else 15s, 30s, 60s, then tries again, up to RETRIES times.
const nextSlot = new Map<string, number>();
async function hostTurn(host: string, extra = 0) {
  const at = Math.max(Date.now(), nextSlot.get(host) ?? 0) + extra;
  nextSlot.set(host, at + HOST_GAP_MS);
  await sleep(at - Date.now());
}
function retryAfterMs(h: string | null, attempt: number): number {
  const n = Number(h), d = h ? Date.parse(h) : NaN;
  const ms = h && Number.isFinite(n) ? n * 1000 : Number.isFinite(d) ? d - Date.now() : 15000 * 2 ** attempt;
  return Math.min(Math.max(ms, 5000), MAX_WAIT_MS);
}
async function get(url: string): Promise<{ status: number; body: string }> {
  const host = new URL(url).host;
  let wait = 0;
  for (let attempt = 0; ; attempt++) {
    await hostTurn(host, wait);
    try {
      const r = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(20000) });
      if (r.status === 429 && attempt < RETRIES) { wait = retryAfterMs(r.headers.get("retry-after"), attempt); await r.body?.cancel(); continue; }
      return { status: r.status, body: await r.text() };
    } catch (e) { return { status: 0, body: `fetch failed: ${String(e instanceof Error ? e.message : e).slice(0, 80)}` }; }
  }
}
const httpWhy = (r: { status: number; body: string }) => r.status ? `HTTP ${r.status}` : r.body;
async function read(url: string): Promise<Read> {
  const page = await get(usdUrl(url));
  const fromPage = page.status === 200 ? usdOffer(page.body, url) : { ok: false as const, why: httpWhy(page) };
  if (fromPage.ok) return fromPage;
  const json = shopifyJsonUrl(url);
  // No .json fallback after a 429 (the shop is rate limiting; more requests only make it worse).
  if (!json || page.status === 429) return { ok: false, gone: page.status === 404 || page.status === 410, why: fromPage.why };
  // Shopify fallback: the product .json, kept only when its variant states USD.
  const j = await get(json);
  const fromJson = j.status === 200 ? usd(fromShopifyJson(j.body, url), "no variant price in .json") : { ok: false as const, why: `.json ${httpWhy(j)}` };
  if (!fromJson.ok) {
    const gone = (page.status === 404 || page.status === 410) && (j.status === 404 || j.status === 410);
    return { ok: false, gone, why: `${fromPage.why}; then ${fromJson.why}` };
  }
  const js = await get(json.replace(/\.json\?/, ".js?"));
  return { ...fromJson, inStock: js.status === 200 ? stockFromShopifyJs(js.body, url) : null };
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
  const fails: string[] = [], reasons = new Map<string, number>(), bySource = new Map<string, number>();
  const tally = (why: string) => { const k = why.replace(/\d{4,}(\.\d+)?/g, "N").replace(/median [\d.]+/, "median N"); reasons.set(k, (reasons.get(k) ?? 0) + 1); };
  const now = new Date().toISOString();
  await Promise.all([...byHost.values()].map(async list => {
    for (const r of list) {
      const url = String(r.url);
      const page = await read(url);
      if (page.ok) bySource.set(page.source, (bySource.get(page.source) ?? 0) + 1);
      if (!page.ok && page.gone) {
        n.hidden++; tally(`hidden: ${page.why}`); fails.push(`${r.slug} ${url}: hidden (${page.why})`);
        if (apply) await client.unsafe(`update "${S}".creator_prices set status = 'hidden' where id = $1`, [r.id]);
        continue;
      }
      if (!page.ok) { n.failed++; tally(page.why); fails.push(`${r.slug} ${url}: ${page.why}`); continue; }
      const others = (offers.get(r.racket_id) ?? []).filter(o => o.id !== r.id).map(o => o.price);
      const sane = plausible(page.price, others);
      if (!sane.ok) { n.rejected++; tally(sane.why.includes("no other offer") ? "rejected: above $1,000 with no other offer" : "rejected: more than 2.5x the other offers"); fails.push(`${r.slug} ${url}: rejected, ${sane.why}`); continue; }
      n.updated++;
      if (Math.abs(page.price - Number(r.price)) >= 0.01) n.priceChanged++;
      const inStock = page.inStock ?? (r.in_stock === true);
      if (inStock !== (r.in_stock === true)) n.stockChanged++;
      if (apply) await client.unsafe(`update "${S}".creator_prices set price = $2, in_stock = $3, listing_title = coalesce(nullif($4, ''), listing_title), checked_at = $5 where id = $1`,
        [r.id, page.price, inStock, page.title, now]);
    }
  }));
  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`${now} pickleball shop prices${apply ? "" : " (dry run)"}: ${rows.length} rows, ${n.updated} read (${n.priceChanged} price, ${n.stockChanged} stock changes), ${n.rejected} rejected (not USD or implausible), ${n.hidden} hidden, ${n.failed} failed (left to go stale), ${mins} min`);
  console.log(`Read from: ${[...bySource].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
  console.log("Not read, by reason:");
  for (const [k, v] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
  console.log("All rows not read:");
  for (const f of fails.sort()) console.log(`  ${f}`);
} finally { await client.end(); }
