// Loads padel shop links into padelrecs.creator_prices (source "padel-shop:..."). Dry run by default; --apply writes.
// Writes need the owner's OK (given 2026-11-26 for the move and the first import).
//   NICHE=padel npx tsx --env-file=.env.local scripts/padel-shop-import.mts --file <padel-offers.json> [--apply]
//     the checked #679 file ({ offers: { <slug>: [{ shop, url, price, currency, inStock, checked }] } }), as it was checked.
//   NICHE=padel npx tsx --env-file=.env.local scripts/padel-shop-import.mts --grok <jobs/padel-shop-urls/out> [--apply] [--out <report.json>]
//     Grok's URL packs ([{ slug, shop, url, name_on_page, note }]): every page is read here first (no AI) and kept only
//     when it answers, names exactly this racket and year (lib/padel-shop-reader.ts sameRacket) and is in the shop's
//     currency. Blocked shops are skipped, never worked around. The rest go to the report for a look.
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { PADEL_SHOP_SOURCE, shopForUrl, shopNamed } from "../lib/padel-shops";
import { readShopPage, sameRacket } from "../lib/padel-shop-reader";

if (niche.id !== "padel") throw new Error("Run with NICHE=padel.");
const args = process.argv.slice(2), flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const apply = args.includes("--apply"), S = niche.schema, file = flag("file"), grok = flag("grok");
if (!file === !grok) throw new Error("Pass --file <json> or --grok <dir>.");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const idOf = (racketId: string, url: string) => `cp_${createHash("sha1").update(`${racketId}|${url}`).digest("hex").slice(0, 16)}`;

type Row = { racketId: string; shop: string; url: string; price: number; currency: string; inStock: boolean; title: string | null; source: string; checked: string };
const { client } = connect();
try {
  const rackets = new Map((await client.unsafe(`select id, slug, name, year from "${S}".rackets`)).map(r => [String(r.slug), r]));
  const have = new Set((await client.unsafe(`select racket_id, url from "${S}".creator_prices`)).map(r => `${r.racket_id}|${r.url}`));
  const rows: Row[] = [], report: Record<string, unknown>[] = [];

  if (file) {
    const data = JSON.parse(await readFile(file, "utf8")) as { offers: Record<string, { shop: string; url: string; price: number; currency: string; inStock: boolean; checked: string }[]> };
    for (const [slug, xs] of Object.entries(data.offers)) {
      const r = rackets.get(slug);
      for (const o of xs) {
        if (!r) { report.push({ slug, url: o.url, why: "racket not in the database" }); continue; }
        if (!shopNamed(o.shop)) { report.push({ slug, url: o.url, why: `unknown shop ${o.shop}` }); continue; }
        rows.push({ racketId: String(r.id), shop: o.shop, url: o.url, price: o.price, currency: o.currency, inStock: o.inStock, title: null,
          source: `${PADEL_SHOP_SOURCE}:grok-2026-11-23`, checked: o.checked });
      }
    }
  } else {
    const packs = (await readdir(grok!)).filter(f => /^pack-\d+\.json$/.test(f)).sort();
    const items: { slug: string; url: string }[] = [];
    for (const f of packs) items.push(...(JSON.parse(await readFile(join(grok!, f), "utf8")) as { slug: string; url: string }[]));
    const today = new Date().toISOString();
    // One host at a time per host, hosts side by side, ~1.2 s apart (the shops' own pace).
    const byHost = new Map<string, typeof items>();
    for (const it of items) { let h = "?"; try { h = new URL(it.url).host; } catch { /* bad URL, reported below */ } byHost.set(h, [...(byHost.get(h) ?? []), it]); }
    await Promise.all([...byHost.values()].map(async list => {
      for (const it of list) {
        const r = rackets.get(it.slug), shop = shopForUrl(it.url);
        if (!r) { report.push({ ...it, why: "racket not in the database" }); continue; }
        if (!shop) { report.push({ ...it, why: "not one of the shops" }); continue; }
        if (/\/products\/trade-/.test(it.url)) { report.push({ ...it, why: "trade-only URL" }); continue; }
        if (have.has(`${r.id}|${it.url}`)) { report.push({ ...it, why: "already stored" }); continue; }
        if (shop.read === "blocked") { report.push({ ...it, why: "shop blocks scripts, not checked, skipped" }); continue; }
        await sleep(1200);
        const page = await readShopPage(shop, it.url);
        if (!page.ok) { report.push({ ...it, why: page.why }); continue; }
        const same = sameRacket(String(r.name), r.year == null ? null : Number(r.year), page.title, it.url);
        if (!same.ok) { report.push({ ...it, title: page.title, why: same.why }); continue; }
        if (page.currency && page.currency !== shop.currency) { report.push({ ...it, why: `currency ${page.currency}, want ${shop.currency}` }); continue; }
        rows.push({ racketId: String(r.id), shop: shop.name, url: it.url, price: page.price, currency: shop.currency, inStock: page.inStock,
          title: page.title, source: `${PADEL_SHOP_SOURCE}:grok-${today.slice(0, 10)}`, checked: today });
      }
    }));
  }

  const racketsN = new Set(rows.map(r => r.racketId)).size;
  console.log(`${rows.length} rows on ${racketsN} rackets ready; ${report.length} left out.`);
  const why = new Map<string, number>(); for (const x of report) why.set(String(x.why).replace(/\d.*$/, "").trim(), (why.get(String(x.why).replace(/\d.*$/, "").trim()) ?? 0) + 1);
  for (const [w, n] of why) console.log(`  left out: ${n} × ${w}`);
  if (flag("out")) await writeFile(flag("out")!, JSON.stringify({ rows, report }, null, 1));
  if (!apply) { console.log("Dry run: nothing written (add --apply)."); process.exit(0); }
  for (const x of rows) {
    await client.unsafe(`insert into "${S}".creator_prices (id, racket_id, shop, url, price, currency, in_stock, edition, listing_title, affiliate, affiliate_note, source, checked_at, status)
      values ($1,$2,$3,$4,$5,$6,$7,null,$8,false,null,$9,$10,'live')
      on conflict (racket_id, url) do update set shop = excluded.shop, price = excluded.price, currency = excluded.currency, in_stock = excluded.in_stock,
        listing_title = coalesce(excluded.listing_title, "${S}".creator_prices.listing_title), source = excluded.source, checked_at = excluded.checked_at, status = 'live'`,
      [idOf(x.racketId, x.url), x.racketId, x.shop, x.url, x.price, x.currency, x.inStock, x.title, x.source, x.checked]);
  }
  const [c] = await client.unsafe(`select count(*)::int n, count(distinct racket_id)::int r from "${S}".creator_prices where source like '${PADEL_SHOP_SOURCE}%'`);
  console.log(`Wrote ${rows.length}. Padel shop rows now: ${c!.n} on ${c!.r} rackets.`);
} finally { await client.end(); }
