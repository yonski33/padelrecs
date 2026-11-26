// Amazon prices for the creator pages (owner 2026-11-23: "yes lets do that, see how it works"), the RedRecs way: one call
// at a time, 1.2 s apart, retrying when Amazon throttles, saving the price with its time so pages never call Amazon. The
// page shows a saved Amazon price only while it is under 24 hours old (Amazon's rule); a daily run keeps it fresh.
// Dry run by default (calls Amazon, writes nothing); --apply upserts creator_prices rows (shop "Amazon") and saves the ASIN
// a name search found to the product's amazon_asin (only where none is saved), so later runs use "saved ASIN".
//   NICHE=skin npx tsx --env-file=.env.local scripts/amazon-prices.mts [--apply] [--asins <file.json>] [--out <dry-run.json>]
//        [--skip <slug,slug>] [--slugs <file>]   # products by slug (comma or newline separated) instead of the live creator pages, e.g.
//                           # pages about to go live; prices are written for live pages only, ASINs for all
// --asins: { "<slug>": "<ASIN>" } hand-checked ASINs, used before the saved one and before a name search.
// A "loose" match (lib/amazon.ts matchesProductLoose) is flagged in the output: check those before --apply.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { amazonCredentials, amazonLink, amazonOfferByAsin, findAmazonOffer } from "../lib/amazon";

const args = process.argv.slice(2), flag = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const apply = args.includes("--apply"), S = niche.schema, PACE_MS = 1200;
const creds = amazonCredentials(), settings = niche.amazon;
if (!creds || !settings) throw new Error("Amazon Creators API credentials or the niche's amazon settings are missing (no values printed).");
const manual: Record<string, string> = flag("asins") ? JSON.parse(await readFile(flag("asins")!, "utf8")) : {};
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
let calls = 0, throttled = 0;
/** One Amazon call, paced, with up to 3 retries on throttling (429) at 3, 6 and 12 seconds. */
async function paced<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await sleep(PACE_MS); calls++;
    try { return await fn(); }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/\(429/.test(msg) && attempt < 3) { throttled++; await sleep(3000 * 2 ** attempt); continue; }
      throw e;
    }
  }
}
const { client } = connect();
try {
  const only = flag("slugs") ? (await readFile(flag("slugs")!, "utf8")).split(/[\s,]+/).filter(Boolean) : null;
  const rows = await client.unsafe(`select p.id, p.slug, p.name, p.amazon_asin, b.name as brand, coalesce(cp.status = 'live', false) as live
    from "${S}".rackets p join "${S}".brands b on b.id = p.brand_id left join "${S}".creator_pages cp on cp.racket_id = p.id
    where ${only ? "p.slug = any($1)" : "cp.status = 'live'"} order by p.slug`, only ? [only] : []);
  // Every ASIN the schema already saved, so one ASIN never ends up on two products (owner 2026-11-26).
  const saved = new Map<string, string[]>();
  for (const x of await client.unsafe(`select slug, amazon_asin from "${S}".rackets where amazon_asin is not null`)) saved.set(x.amazon_asin, [...(saved.get(x.amazon_asin) ?? []), x.slug]);
  const out: Record<string, any>[] = [];
  // --skip <slug,slug>: products the owner's review left out (no lookup, nothing written).
  const skip = new Set((flag("skip") ?? "").split(",").map(x => x.trim()).filter(Boolean));
  for (const r of rows.filter((x: any) => !skip.has(x.slug))) {
    const asin = manual[r.slug] ?? r.amazon_asin ?? null;
    let res: { asin: string; title: string; price: string | null; url: string; match?: "name" | "loose"; doubt?: string } | null = null, how = asin ? (manual[r.slug] ? "hand-checked ASIN" : "saved ASIN") : "name search", err: string | null = null;
    try { res = asin ? await paced(() => amazonOfferByAsin(asin, settings, creds)) : await paced(() => findAmazonOffer({ name: r.name, brand: r.brand }, settings, creds, fetch, m => { err = m.slice(0, 240); })); }
    catch (e) { err = e instanceof Error ? e.message : String(e); }
    const price = res?.price ? Number(res.price.replace(/[^0-9.]/g, "")) : null;
    const found = !asin && res ? res.asin : null, others = found ? (saved.get(found) ?? []).filter(s => s !== r.slug) : [];
    const doubts = [res?.match === "loose" && "loose match", res?.doubt, others.length && `ASIN already saved for ${others.join(", ")}`].filter(Boolean) as string[];
    out.push({ slug: r.slug, name: r.name, live: r.live, how, asin: res?.asin ?? asin, match: res?.match ?? null, found, doubts, title: res?.title ?? null, price: res?.price ?? null, note: err });
    console.log(`${r.slug.padEnd(58)} ${how.padEnd(18)} ${String(res?.asin ?? "-").padEnd(11)} ${res?.price ?? "no price"}${doubts.length ? `  CHECK: ${doubts.join("; ")}` : ""}${err ? `  (${err.slice(0, 90)})` : ""}`);
  }
  // A found ASIN two products share in this run is doubtful for both; doubtful ASINs are listed, never saved.
  const byFound = new Map<string, string[]>();
  for (const o of out) if (o.found) byFound.set(o.found, [...(byFound.get(o.found) ?? []), o.slug]);
  for (const o of out) if (o.found && byFound.get(o.found)!.length > 1) o.doubts.push(`same ASIN found for ${byFound.get(o.found)!.filter((s: string) => s !== o.slug).join(", ")}`);
  for (const [i, r] of rows.filter((x: any) => !skip.has(x.slug)).entries()) {
    const o = out[i], res = o.asin && o.title ? { asin: o.asin as string, title: o.title as string, url: amazonLink(o.asin, creds.partnerTag, settings.marketplace ?? "www.amazon.com") } : null;
    const price = o.price ? Number(String(o.price).replace(/[^0-9.]/g, "")) : null;
    o.save_asin = o.found && !o.doubts.length ? o.found : null;
    if (apply && o.save_asin) await client.unsafe(`update "${S}".rackets set amazon_asin = $1 where id = $2 and amazon_asin is null`, [o.save_asin, r.id]);
    if (apply && res && price && r.live && !(o.found && o.doubts.length)) {
      const id = `cp_${createHash("sha1").update(`${r.id}|amazon`).digest("hex").slice(0, 16)}`;
      await client.unsafe(`insert into "${S}".creator_prices (id, racket_id, shop, url, price, currency, in_stock, edition, listing_title, affiliate, affiliate_note, source, checked_at, status)
        values ($1,$2,'Amazon',$3,$4,'USD',true,null,$5,true,'Amazon Associates','amazon-creators-api',$6,'live')
        on conflict (racket_id, url) do update set price = excluded.price, listing_title = excluded.listing_title, checked_at = excluded.checked_at, status = 'live'`,
        [id, r.id, res.url, price, res.title, new Date().toISOString()]);
    }
  }
  const got = out.filter(o => o.price).length, saves = out.filter(o => o.save_asin).length, doubtful = out.filter(o => o.found && o.doubts.length);
  for (const o of doubtful) console.log(`CHECK ${o.slug} ${o.found}: ${o.doubts.join("; ")} | "${String(o.title).slice(0, 110)}"`);
  console.log(`\n${rows.length} products, ${got} Amazon prices, ${saves} ASINs to save, ${doubtful.length} doubtful (listed, not saved), ${calls} calls, ${throttled} throttled (429) and retried.${apply ? " Written." : " Dry run: nothing written."}`);
  if (flag("out")) await writeFile(flag("out")!, JSON.stringify({ at: new Date().toISOString(), calls, throttled, results: out }, null, 1));
} finally { await client.end(); }
process.exit(0);
