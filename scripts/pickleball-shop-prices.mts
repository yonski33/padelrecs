// Daily refresh of PickleballRecs shop prices (owner 2026-11-26: "get daily prices for all paddles with the script"; no AI,
// current price only, no history). Re-reads every live non-Amazon row in pickleballrecs.creator_prices (Amazon has its own
// daily job, scripts/amazon-prices.mts) and updates price, stock, title and checked_at. A page that answers 404/410 is hidden
// (status 'hidden'). A shop that rate-limits or blocks scripts, or a page that fails today, is left alone: its row goes stale
// and the pages hide it after 3 days (db/creator-reviews.ts SHOP_MAX_AGE_MS). Nothing is worked around.
// Shopify shops: price from the product's .json (the shop's own currency; .js answers in the visitor's local currency), stock
// from its .js. Other shops: the page's schema.org Product (lib/padel-shop-reader.ts fromJsonLd), USD only.
// Dry run by default; --apply writes. Run by a local scheduled job (deployment/launchd/), never a Claude task.
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/pickleball-shop-prices.mts [--apply] [--limit N]
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { fromJsonLd, UA } from "../lib/padel-shop-reader";

if (niche.id !== "pickleball") throw new Error("Run with NICHE=pickleball.");
const args = process.argv.slice(2), apply = args.includes("--apply");
const limit = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
const S = niche.schema, PACE_MS = 1500;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const headers = { ...UA, "user-agent": "PickleballRecsPriceCheck/1.0 (+https://www.pickleballrecs.com)" };

type Read = { ok: true; title: string; price: number; inStock: boolean } | { ok: false; gone: boolean; why: string };
async function get(url: string): Promise<{ status: number; body: string } | { status: 0; body: string }> {
  try { const r = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(20000) }); return { status: r.status, body: await r.text() }; }
  catch (e) { return { status: 0, body: String(e instanceof Error ? e.message : e).slice(0, 100) }; }
}
const fail = (status: number, body: string): Read => ({ ok: false, gone: status === 404 || status === 410, why: status ? `HTTP ${status}` : `fetch failed: ${body}` });
/** Shopify: the variant in ?variant= if any, else the first available, else the first. */
async function readShopify(url: string): Promise<Read> {
  const u = new URL(url), variant = u.searchParams.get("variant"), base = `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
  const j = await get(`${base}.json`);
  if (j.status !== 200) return fail(j.status, j.body);
  await sleep(PACE_MS);
  const js = await get(`${base}.js`);
  if (js.status !== 200) return fail(js.status, js.body);
  try {
    const p = JSON.parse(j.body).product as { title: string; variants: { id: number; price: string }[] };
    const a = JSON.parse(js.body) as { variants: { id: number; available: boolean }[] };
    const avail = new Map(a.variants.map(v => [String(v.id), v.available]));
    const v = p.variants.find(x => String(x.id) === variant) ?? p.variants.find(x => avail.get(String(x.id))) ?? p.variants[0];
    if (!v || !(Number(v.price) > 0)) return { ok: false, gone: false, why: "no price in .json" };
    const inStock = variant ? avail.get(String(v.id)) === true : a.variants.some(x => x.available);
    return { ok: true, title: p.title, price: Number(v.price), inStock };
  } catch { return { ok: false, gone: false, why: "bad .json/.js" }; }
}
async function readJsonLd(url: string): Promise<Read> {
  const r = await get(url);
  if (r.status !== 200) return fail(r.status, r.body);
  const p = fromJsonLd(r.body);
  if (!p.ok) return { ok: false, gone: false, why: p.why };
  if (p.currency && p.currency !== "USD") return { ok: false, gone: false, why: `currency ${p.currency}` };
  return { ok: true, title: p.title, price: p.price, inStock: p.inStock };
}
const isShopify = (url: string) => /\/products\/[^/?#]+/.test(new URL(url).pathname);

const { client } = connect();
const started = Date.now();
try {
  const rows = (await client.unsafe(`select c.id, c.shop, c.url, c.price, c.in_stock, p.slug from "${S}".creator_prices c
    join "${S}".rackets p on p.id = c.racket_id where c.status = 'live' and c.shop <> 'Amazon' order by c.shop, p.slug`)).slice(0, limit);
  const byHost = new Map<string, typeof rows>();
  for (const r of rows) { const h = new URL(String(r.url)).host; byHost.set(h, [...(byHost.get(h) ?? []), r]); }
  const n = { updated: 0, priceChanged: 0, stockChanged: 0, hidden: 0, failed: 0 };
  const fails: string[] = [];
  const now = new Date().toISOString();
  await Promise.all([...byHost.values()].map(async list => {
    for (const r of list) {
      await sleep(PACE_MS);
      const url = String(r.url);
      const read = () => isShopify(url) ? readShopify(url) : readJsonLd(url);
      let page = await read();
      if (!page.ok && /HTTP 429/.test(page.why)) { await sleep(20000); page = await read(); }
      if (!page.ok && page.gone) {
        n.hidden++; fails.push(`${r.slug} ${url}: hidden (${page.why})`);
        if (apply) await client.unsafe(`update "${S}".creator_prices set status = 'hidden' where id = $1`, [r.id]);
        continue;
      }
      if (!page.ok) { n.failed++; fails.push(`${r.slug} ${url}: ${page.why}`); continue; }
      n.updated++;
      if (Math.abs(page.price - Number(r.price)) >= 0.01) n.priceChanged++;
      if (page.inStock !== (r.in_stock === true)) n.stockChanged++;
      if (apply) await client.unsafe(`update "${S}".creator_prices set price = $2, in_stock = $3, listing_title = $4, checked_at = $5 where id = $1`,
        [r.id, page.price, page.inStock, page.title, now]);
    }
  }));
  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`${now} pickleball shop prices${apply ? "" : " (dry run)"}: ${rows.length} rows, ${n.updated} read (${n.priceChanged} price, ${n.stockChanged} stock changes), ${n.hidden} hidden, ${n.failed} failed (left to go stale), ${mins} min`);
  for (const f of fails.slice(0, 60)) console.log(`  ${f}`);
  if (fails.length > 60) console.log(`  ... ${fails.length - 60} more`);
} finally { await client.end(); }
