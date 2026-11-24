// Creator-review pages (drizzle/0039, PickleballRecs first): back up, apply 0039, and import the staged, fact-checked reviews,
// TikTok takes and shop prices. Idempotent: upserts on (racket_id, url); rows already in the DB that the files no longer
// have are listed, never deleted. Dry run by default (reads only). See CREATOR-DB-SCHEMA.md in the shared notes.
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/creator-reviews.mts backup <dir>
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/creator-reviews.mts migrate --owner-ok      (0039 only, plain SQL)
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/creator-reviews.mts import [--apply] --staging <file> \
//     --verified <dir> --tiktok <dir> --prices <file> [--fixture <db/creators/pickleball.json>] [--channels <file>]
// 0039 is applied as plain statements with no drizzle tracking row (like 0038), so unrun earlier entries are not skipped
// later; every statement in it is safe to run twice.
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { forSchema, migrationsTable } from "../db/migrations";

const SITES = new Set(["pickleball", "skin", "padel"]);
if (!SITES.has(niche.id)) throw new Error(`Creator reviews are on PickleballRecs, SkinRecs and PadelRecs only: run with NICHE=pickleball, skin or padel (got ${niche.id}).`);
const S = niche.schema;
const args = process.argv.slice(2), cmd = args[0];
const flag = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const has = (name: string) => args.includes(`--${name}`);
const TABLES = ["creator_pages", "creator_reviews", "creator_prices"] as const;

// ---- Owner decisions (2026-11-22), as in the #649 fixture builder ----
/** Weak sources the owner dropped. */
const DROP = new Set(["FORWRD", "Man vs Debt", "REDTACKLE", "PickleballCentral", "Pickleball Hustle"]);
/** Scores kept in the data but hidden until the scale is confirmed. */
const HIDE_SCORE = new Set(["Pickleheads"]);
/** Plain auto-caption spelling typos in quotes. */
const TYPOS: [RegExp, string][] = [[/\ballcourt\b/g, "all-court"], [/\bpadle\b/g, "paddle"], [/\bpadles\b/g, "paddles"]];
const PICKLEBALL_ATTR: Record<string, string> = { power: "power", control: "control", spin: "spin", pop: "pop", forgiveness: "sweet",
  comfort: "comfort", durability: "durability", value: "value" };
/** SkinRecs' attribute words (the skin sweep's reader brief), keys as stored (spaces become underscores). */
const SKIN_ATTR: Record<string, string> = Object.fromEntries(["texture", "hydration", "finish", "results", "irritation", "absorption",
  "scent", "value", "packaging", "white cast", "sun protection", "adhesion"].map(k => [k, k.replace(/ /g, "_")]));
/** PadelRecs' attribute words (the padel sweep, 2026-11-23). */
const PADEL_ATTR: Record<string, string> = { power: "power", control: "control", sweet_spot: "sweet", comfort: "comfort", maneuverability: "maneuver",
  spin: "spin", durability: "durability" };
const ATTR = niche.id === "skin" ? SKIN_ATTR : niche.id === "padel" ? PADEL_ATTR : PICKLEBALL_ATTR;
const WORDS = new Set(["Excellent", "Great", "Good", "Okay", "Weak"]);
const STANCE: Record<string, "pos" | "mix" | "neg"> = { "Loved it": "pos", Mixed: "mix", "Not for me": "neg" };
/** Chapters that say nothing about the paddle. */
const SKIP_CH = /\b(intro(duction)?|outro|verdict|discount|code|sponsor|giveaway|subscribe|affiliate|disclaimer|disclosure|preview|tldr|recap|wrap ?up)\b/i;
/** Disclosed brand ties (paddles 1-20 sweep), shown as "Works with <brand>" only on that brand's paddles. */
const TIES: Record<string, string> = { "Johnkew Pickleball": "Spartus", "Pickleball Advocate": "RPM", "Cohen Academy": "RPM", "vonEgypt Pickleball": "11SIX24" };

type Row = Record<string, unknown> & { racket_id: string; url: string };
const id = (prefix: string, ...parts: string[]) => `${prefix}_${createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16)}`;
const secs = (t: string | null | undefined) => { if (!t) return null; let n = 0; for (const p of String(t).split(":")) n = n * 60 + Number(p); return Number.isFinite(n) ? n : null; };
const fixQuote = (q: string | null | undefined) => { if (!q) return null; let s = q; for (const [a, b] of TYPOS) s = s.replace(a, b); return s; };
const attrs = (a: Record<string, string> = {}) => Object.fromEntries(Object.entries(a).filter(([k, v]) => ATTR[k] && WORDS.has(v)).map(([k, v]) => [ATTR[k], v]));
const chapters = (cs: unknown[] = []) => cs.map(c => Array.isArray(c) ? [secs(c[0]), String(c[1]).trim()] : [secs((c as { t: string }).t), String((c as { title: string }).title).trim()])
  .filter(([s, t]) => typeof s === "number" && s > 0 && !SKIP_CH.test(t as string));
function score(sc: unknown): { value: number; scale: number; label: string | null } | null {
  if (!sc) return null;
  if (typeof sc === "string") { const m = sc.match(/^\s*([\d.]+)\s*\/\s*([\d.]+)\s*$/); return m ? { value: Number(m[1]), scale: Number(m[2]), label: null } : null; }
  const o = sc as { value: number; scale: number; label?: string };
  return o.value != null && o.scale ? { value: o.value, scale: o.scale, label: o.label ?? null } : null;
}

type Fixture = { paddles: Record<string, { tldr: string; groups: Record<string, string>; reviews: { creator: string; url: string; short: string; stood: string | null; trade: string | null; compared: string | null; version: string | null; note: string | null }[] }> };

async function loadInputs() {
  // Each site's own inputs: PickleballRecs the three paddle sweeps, TikTok and prices; SkinRecs one file per product (--skin).
  const skinSite = niche.id === "skin";
  const need = (n: string) => { const v = flag(n); if (!v) throw new Error(`--${n} is required`); return v; };
  const dir = async (d: string | undefined) => d ? Promise.all((await readdir(d)).filter(f => f.endsWith(".json") && !f.startsWith("tokens"))
    .map(async f => JSON.parse(await readFile(join(d, f), "utf8")))) : [];
  // --cards <file> alone (paddles 51-80, owner OK 2026-11-23): one later batch of checked cards, imported without the earlier
  // sweeps, so rows already in the DB are not touched.
  const cardsOnly = !skinSite && !!flag("cards");
  const cards = flag("cards") ? JSON.parse(await readFile(flag("cards")!, "utf8")).paddles : [];
  const staging = skinSite || cardsOnly ? { paddles: [] } : JSON.parse(await readFile(need("staging"), "utf8"));
  const verified = await dir(skinSite || cardsOnly ? flag("verified") : need("verified"));
  const tiktok = await dir(skinSite || cardsOnly ? flag("tiktok") : need("tiktok"));
  const skin = skinSite ? await dir(need("skin")) : [];
  const videoChannels: Record<string, string> = flag("video-channels") ? JSON.parse(await readFile(flag("video-channels")!, "utf8")) : {};
  const prices = flag("prices") || !(skinSite || cardsOnly) ? JSON.parse(await readFile(need("prices"), "utf8")) : { paddles: [], checked_date: null };
  const fixture: Fixture | null = flag("fixture") ? JSON.parse(await readFile(flag("fixture")!, "utf8")) : null;
  // Glance-table key points (0040): out/batch-*.json files of { "<review id>": "<line>" }, written from the verified fields.
  const keyPoints: Record<string, string> = {};
  if (flag("key-points")) for (const f of (await readdir(flag("key-points")!)).filter(f => f.endsWith(".json")))
    Object.assign(keyPoints, JSON.parse(await readFile(join(flag("key-points")!, f), "utf8")));
  const channels: Record<string, string> = flag("channels") ? JSON.parse(await readFile(flag("channels")!, "utf8")) : {};
  return { staging, verified, tiktok, prices, fixture, channels, keyPoints, skin: [...skin, ...cards], videoChannels };
}

/** Every row the files describe, by product slug (resolved to racket ids later). */
function buildRows(inp: Awaited<ReturnType<typeof loadInputs>>, brandOf: (slug: string) => string | null) {
  const now = new Date().toISOString();
  const reviews: (Row & { slug: string })[] = [], prices: (Row & { slug: string })[] = [], pages = new Map<string, Row & { slug: string }>();
  const skipped: string[] = [];
  // Channel links: the 1-20 sweep has them; the 21-50 files do not, so they come from the same creator name there or --channels.
  const channelOf = new Map<string, string>(Object.entries(inp.channels));
  for (const p of inp.staging.paddles) for (const r of p.reviews) if (r.channel_url && !channelOf.has(r.creator)) channelOf.set(r.creator, r.channel_url);
  const base = (slug: string, r: Record<string, any>) => ({ slug, racket_id: "", url: r.url as string });

  for (const p of inp.staging.paddles) {
    const fx = inp.fixture?.paddles[p.slug];
    for (const r of p.reviews) {
      if (DROP.has(r.creator)) { skipped.push(`${p.slug}: ${r.creator} (weak source)`); continue; }
      const f = fx?.reviews.find(x => x.url === r.url);
      const sc = score(r.creator_score), ev: string = r.evidence_note ?? "";
      const tie = TIES[r.creator];
      reviews.push({ ...base(p.slug, r), platform: r.kind, review_type: r.type, creator: r.creator, channel_url: r.channel_url ?? null,
        handle: null, same_channel_as: null, language: (r.language || "en").toLowerCase(), published_on: r.date ?? null,
        duration_s: r.duration_s ?? null, video_id: r.video_id ?? null, thumbnail_url: null, stance: STANCE[r.stance],
        summary: r.summary, summary_more: r.summary_more ?? null, summary_short: f?.short ?? r.summary_short ?? null,
        highlights: (r.highlights ?? []).filter((h: string) => r.summary.includes(h)),
        stood_out: r.stood_out ?? f?.stood ?? null, trade_off: r.trade_off ?? f?.trade ?? null, compared_to: r.compared_to ?? f?.compared ?? null,
        quote: fixQuote(r.quote), quote_at_s: secs(r.quote_at), chapters: chapters(r.chapters), attributes: attrs(r.attributes), tags: [],
        score_value: sc?.value ?? null, score_scale: sc?.scale ?? null, score_label: sc?.label ?? null, score_hidden: !!sc && HIDE_SCORE.has(r.creator),
        measured: r.measured ?? {}, also_url: r.also_url ?? null, version: r.version ?? f?.version ?? null, edition: null,
        note: r.type === "long-term" ? "Long-term" : /first[ -]impressions/i.test(ev) ? "First impressions" : f?.note ?? null,
        brand_tie: tie && brandOf(p.slug)?.toLowerCase() === tie.toLowerCase() ? tie : null, disclosure: null,
        evidence_note: ev || null, check_result: r.summary_source ?? null, status: "live", source: "pb-creator-reviews-staging 2026-11-22",
        created_at: now, updated_at: now });
    }
    if (fx) pages.set(p.slug, { slug: p.slug, racket_id: "", url: "", tldr: fx.tldr, group_pos: fx.groups.pos || null, group_mix: fx.groups.mix || null, group_neg: fx.groups.neg || null });
  }
  for (const v of inp.verified) for (const r of v.reviews) {
    if (r.result === "drop") { skipped.push(`${v.slug}: ${r.creator} (checker drop)`); continue; }
    if (DROP.has(r.creator)) { skipped.push(`${v.slug}: ${r.creator} (weak source)`); continue; }
    const sc = score(r.creator_score);
    reviews.push({ ...base(v.slug, r), platform: r.kind, review_type: r.type, creator: r.creator,
      channel_url: r.channel_url ?? (r.kind === "blog" ? new URL(r.url).origin : channelOf.get(r.creator) ?? null),
      handle: null, same_channel_as: null, language: (r.language || "en").toLowerCase(), published_on: r.date ?? null,
      duration_s: secs(r.duration), video_id: r.video_id ?? null, thumbnail_url: null, stance: STANCE[r.stance],
      summary: r.summary, summary_more: r.summary_more ?? null, summary_short: null,
      highlights: (r.highlights ?? []).filter((h: string) => r.summary.includes(h)),
      stood_out: r.stood_out ?? null, trade_off: r.trade_off ?? null, compared_to: r.compared_to ?? null,
      quote: fixQuote(r.quote), quote_at_s: secs(r.quote_at), chapters: chapters(r.chapters), attributes: attrs(r.attributes), tags: [],
      score_value: sc?.value ?? null, score_scale: sc?.scale ?? null, score_label: sc?.label ?? null, score_hidden: !!sc && HIDE_SCORE.has(r.creator),
      measured: r.measured ?? {}, also_url: r.also_url ?? null, version: r.version ?? null, edition: null,
      note: r.type === "long-term" ? "Long-term" : null, brand_tie: null, disclosure: r.brand_tie ?? null,
      evidence_note: r.evidence_note ?? null, check_result: r.result ?? null, status: "live", source: "pb-creator-reviews-21-50 verified 2026-11-22",
      created_at: now, updated_at: now });
  }
  // SkinRecs (owner "Yes, Skin next" 2026-11-23): the checked skin sweep, one file per product slug. Its key points are
  // written with the reviews (a final period added where missing); the reviewer's skin type rides in `measured`.
  for (const v of inp.skin) for (const r of v.reviews) {
    const sc = score(r.creator_score), kp = (r.key_point ?? "").trim();
    reviews.push({ ...base(v.slug, r), platform: r.kind, review_type: r.type, creator: r.creator,
      channel_url: r.channel_url ?? (r.kind === "blog" ? new URL(r.url).origin : inp.videoChannels[r.video_id] ?? null),
      handle: null, same_channel_as: null, language: (r.language || "en").toLowerCase(), published_on: r.date ?? null,
      duration_s: r.duration_s ?? secs(r.duration), video_id: r.video_id ?? null, thumbnail_url: null, stance: STANCE[r.stance],
      summary: r.summary, summary_more: r.summary_more ?? null, summary_short: null,
      highlights: (r.highlights ?? []).filter((h: string) => r.summary.includes(h)),
      stood_out: r.stood_out ?? null, trade_off: r.trade_off ?? null, compared_to: r.compared_to ?? null,
      quote: fixQuote(r.quote), quote_at_s: secs(r.quote_at), chapters: chapters(r.chapters), attributes: attrs(r.attributes), tags: [],
      score_value: sc?.value ?? null, score_scale: sc?.scale ?? null, score_label: sc?.label ?? null, score_hidden: !!sc && HIDE_SCORE.has(r.creator),
      measured: r.skin_type ? { skin_type: r.skin_type } : r.measured ?? {}, also_url: r.also_url ?? null, version: r.version ?? null, edition: null,
      note: r.type === "long-term" ? "Long-term" : null, brand_tie: null, disclosure: r.disclosure ?? null,
      evidence_note: r.evidence_note ?? null, check_result: "checked", status: "live",
      source: niche.id === "skin" ? "skin-creator-reviews 2026-11-22" : niche.id === "padel" ? "padel-creator-reviews 2026-11-23 (API batch, transcripts)" : "pb-creator-reviews-51-80 2026-11-23",
      key_point: kp ? (/[.!?]$/.test(kp) ? kp : `${kp}.`) : null, created_at: now, updated_at: now });
  }
  const EDITIONS = new Set(["original", "crystal_blue", "unknown"]);
  const TT_TYPE: Record<string, string> = { full_review: "review", short_update: "short_update", ranking_mention: "ranking_mention" };
  for (const f of inp.tiktok) for (const t of f.takes) {
    if (t.check === "drop" || t.check === "unverified") { skipped.push(`${f.slug}: TikTok ${t.handle} (${t.check})`); continue; }
    reviews.push({ ...base(f.slug, t), platform: "tiktok", review_type: TT_TYPE[t.kind] ?? "review", creator: t.creator,
      channel_url: `https://www.tiktok.com/${t.handle}`, handle: t.handle, same_channel_as: t.same_channel_as ?? null,
      language: (t.language || "en").toLowerCase(), published_on: t.date ?? null, duration_s: secs(t.duration), video_id: null,
      thumbnail_url: t.thumbnail_url ?? null, stance: STANCE[t.stance], summary: t.take, summary_more: null, summary_short: t.take,
      highlights: [], stood_out: null, trade_off: null, compared_to: null, quote: fixQuote(t.quote), quote_at_s: secs(t.quote_time),
      chapters: [], attributes: {}, tags: t.tags ?? [], score_value: null, score_scale: null, score_label: null, score_hidden: false,
      measured: {}, also_url: null,
      // The edition column takes original / crystal_blue / unknown only; any other note ("16mm", "armorgrit") goes in version.
      version: t.edition && !EDITIONS.has(t.edition) ? (t.edition === "armorgrit" ? "ArmorGrit" : t.edition) : null,
      edition: t.edition && EDITIONS.has(t.edition) ? t.edition : null, note: null, brand_tie: null, disclosure: t.disclosure ?? null,
      evidence_note: [t.transcript_source, t.caption_source, t.fix_note].filter(Boolean).join("; ") || null, check_result: t.check,
      status: "live", source: "tiktok-check verified 2026-11-22", created_at: now, updated_at: now });
  }
  for (const p of inp.prices.paddles) for (const o of p.offers) {
    const aff = String(o.affiliate ?? "");
    prices.push({ slug: p.slug, racket_id: "", url: o.url, shop: o.shop, price: o.price, currency: o.currency ?? "USD", in_stock: !!o.in_stock,
      edition: o.edition ?? null, listing_title: o.listing_title ?? null, affiliate: aff.startsWith("yes"), affiliate_note: aff || null,
      source: o.source ?? "price sweep", checked_at: o.checked_at ?? inp.prices.checked_date, status: "live" });
  }
  for (const r of reviews) if (!pages.has(r.slug))
    pages.set(r.slug, { slug: r.slug, racket_id: "", url: "", tldr: null, group_pos: null, group_mix: null, group_neg: null });
  return { reviews, prices, pages: [...pages.values()].map(p => ({ ...p, status: "live", updated_at: now })), skipped };
}

/** Copy checks on everything a visitor can read. */
function copyProblems(rows: Row[]) {
  const shown = ["summary", "summary_more", "summary_short", "stood_out", "trade_off", "compared_to", "quote", "tldr", "group_pos", "group_mix", "group_neg"];
  const out: string[] = [];
  for (const r of rows) for (const k of shown) {
    const v = r[k];
    if (typeof v !== "string") continue;
    if (/[—–]/.test(v)) out.push(`em/en dash: ${r.slug} ${r.creator ?? ""} ${k}`);
    if (/\bverdict\b/i.test(v)) out.push(`"verdict": ${r.slug} ${r.creator ?? ""} ${k}`);
  }
  for (const r of rows) if (r.stance !== undefined && !r.stance) out.push(`no stance: ${r.slug} ${r.creator}`);
  return out;
}

const REVIEW_COLS_BASE = ["id", "racket_id", "url", "platform", "review_type", "creator", "channel_url", "handle", "same_channel_as", "language",
  "published_on", "duration_s", "video_id", "thumbnail_url", "stance", "summary", "summary_more", "summary_short", "highlights", "stood_out",
  "trade_off", "compared_to", "quote", "quote_at_s", "chapters", "attributes", "tags", "score_value", "score_scale", "score_label",
  "score_hidden", "measured", "also_url", "version", "edition", "note", "brand_tie", "disclosure", "evidence_note", "check_result", "status",
  "source", "created_at", "updated_at"];
/** Rules for the glance-table line (owner 2026-11-22). */
export function keyPointProblems(line: string) {
  const out: string[] = [], words = line.trim().split(/\s+/).length;
  if (words < 6 || words > 12) out.push(`${words} words`);
  if (line.length > 70) out.push(`${line.length} chars`);
  if (!/\.$/.test(line)) out.push("no final period");
  if (/[—–]/.test(line)) out.push("dash");
  if (/\bverdict\b/i.test(line)) out.push("verdict");
  if (/\b(we|us|our|I|he|she|his|her)\b/.test(line)) out.push("pronoun");
  if (/\b(owners?|creators?)\b/i.test(line)) out.push("owners/creators");
  return out;
}
const PRICE_COLS = ["id", "racket_id", "shop", "url", "price", "currency", "in_stock", "edition", "listing_title", "affiliate", "affiliate_note",
  "source", "checked_at", "status"];
const PAGE_COLS = ["racket_id", "tldr", "group_pos", "group_mix", "group_neg", "status", "updated_at"];

async function main() {
  const { client } = connect();
  try {
    if (cmd === "backup") {
      const dir = args[1]; if (!dir) throw new Error("Usage: backup <dir>");
      await mkdir(dir, { recursive: true });
      const tables = await client`select table_name from information_schema.tables where table_schema = ${S} order by 1`;
      const mig = await client.unsafe(`select * from drizzle."${migrationsTable(S)}" order by created_at`);
      const brands = await client.unsafe(`select * from "${S}"."brands" order by id`);
      const rackets = await client.unsafe(`select * from "${S}"."rackets" order by id`);
      const existing: Record<string, unknown[]> = {};
      for (const t of TABLES) if (tables.some(x => x.table_name === t)) existing[t] = await client.unsafe(`select * from "${S}"."${t}"`);
      const w = (n: string, v: unknown) => writeFile(join(dir, n), JSON.stringify(v, null, 1), { mode: 0o600 });
      await w("tables.json", tables.map(t => t.table_name)); await w("migrations.json", mig); await w("brands.json", brands);
      await w("rackets.json", rackets); await w("creator-tables.json", existing);
      console.log(`Backed up ${S} to ${dir}: ${tables.length} tables listed, ${mig.length} migration rows, ${brands.length} brands, ${rackets.length} rackets,`,
        Object.keys(existing).length ? Object.fromEntries(Object.entries(existing).map(([k, v]) => [k, v.length])) : "no creator_* tables yet");
      return;
    }
    if (cmd === "migrate") {
      if (!has("owner-ok")) throw new Error("migrate needs --owner-ok (the owner's typed OK in the session, after a backup).");
      const file = flag("file") ?? "drizzle/0039_creator_reviews.sql";
      const sql = forSchema(await readFile(file, "utf8"), S);
      await client.begin(async tx => { for (const st of sql.split("--> statement-breakpoint")) if (st.trim()) await tx.unsafe(st); });
      const t = await client`select table_name from information_schema.tables where table_schema = ${S} and table_name like 'creator_%' order by 1`;
      console.log(`${file} applied to ${S}:`, t.map(x => x.table_name).join(", "));
      return;
    }
    if (cmd !== "import") throw new Error("Usage: backup <dir> | migrate --owner-ok | import [--apply] ...");
    const apply = has("apply");
    const inp = await loadInputs();
    const rk = await client.unsafe(`select r.id, r.slug, b.name as brand from "${S}"."rackets" r join "${S}"."brands" b on b.id = r.brand_id`);
    const redirects = await client.unsafe(`select slug, racket_id from "${S}"."racket_slug_redirects"`).catch(() => []);
    const bySlug = new Map<string, { id: string; brand: string }>(rk.map(r => [r.slug, { id: r.id, brand: r.brand }]));
    for (const r of redirects) if (!bySlug.has(r.slug)) { const x = rk.find(k => k.id === r.racket_id); if (x) bySlug.set(r.slug, { id: x.id, brand: x.brand }); }
    const built = buildRows(inp, slug => bySlug.get(slug)?.brand ?? null);
    const missing = [...new Set([...built.reviews, ...built.prices, ...built.pages].map(r => r.slug).filter(s => !bySlug.has(s)))];
    if (missing.length) throw new Error(`Slugs not in ${S}.rackets: ${missing.join(", ")}`);
    for (const r of [...built.reviews, ...built.prices, ...built.pages]) r.racket_id = bySlug.get(r.slug)!.id;
    for (const r of built.reviews) r.id = id("cr", r.racket_id, r.url);
    // Key points from --key-points (pickleball) or written with the reviews (skin).
    const withKp = Object.keys(inp.keyPoints).length > 0 || built.reviews.some(r => r.key_point);
    if (Object.keys(inp.keyPoints).length) for (const r of built.reviews) r.key_point = inp.keyPoints[r.id as string] ?? null;
    for (const r of built.prices) r.id = id("cp", r.racket_id, r.url);
    // One row per (product, url): a duplicate inside the files is a data problem, reported and the first kept.
    const seen = new Set<string>(), dups: string[] = [];
    built.reviews = built.reviews.filter(r => { const k = `${r.racket_id}|${r.url}`; if (seen.has(k)) { dups.push(`${r.slug} ${r.creator} ${r.url}`); return false; } seen.add(k); return true; });
    // --drop-url <url,...>: takes the owner left out (2026-11-23: three Ronbus/Pakle TikToks).
    const dropUrls = new Set((flag("drop-url") ?? "").split(",").map(u => u.trim()).filter(Boolean));
    if (dropUrls.size) { const before = built.reviews.length; built.reviews = built.reviews.filter(r => !dropUrls.has(r.url)); console.log(`Dropped by --drop-url: ${before - built.reviews.length}`); }
    // --insert-only (owner 2026-11-23): rows and pages already in the DB are left exactly as they are.
    if (has("insert-only")) {
      const curIds = new Set((await client.unsafe(`select id from "${S}"."creator_reviews"`)).map(r => r.id as string));
      const curPages = new Set((await client.unsafe(`select racket_id from "${S}"."creator_pages"`)).map(r => r.racket_id as string));
      const before = built.reviews.length;
      built.reviews = built.reviews.filter(r => !curIds.has(r.id as string));
      built.pages = built.pages.filter(p => !curPages.has(p.racket_id as string) && built.reviews.some(r => r.racket_id === p.racket_id));
      console.log(`--insert-only: ${before - built.reviews.length} already in the DB, left alone`);
    }
    const problems = copyProblems([...built.reviews, ...built.pages]);
    if (withKp) {
      const missingKp = built.reviews.filter(r => !r.key_point);
      if (missingKp.length) problems.push(`no key point: ${missingKp.length} rows (${missingKp.slice(0, 5).map(r => r.id).join(", ")})`);
      for (const r of built.reviews) if (r.key_point) for (const p of keyPointProblems(r.key_point as string)) problems.push(`key point ${p}: ${r.id} ${r.key_point}`);
      const known = new Set(built.reviews.map(r => r.id)), stray = Object.keys(inp.keyPoints).filter(k => !known.has(k));
      if (stray.length) problems.push(`key points for unknown ids: ${stray.join(", ")}`);
    }
    const bad = built.reviews.filter(r => !r.stance || !r.summary || !["youtube", "blog", "tiktok"].includes(r.platform as string));
    const noChannel = built.reviews.filter(r => !r.channel_url);

    // Per-paddle table.
    const slugs = [...new Set(built.pages.map(p => p.slug))].sort();
    console.log(`\n${apply ? "APPLY" : "DRY RUN"} on ${S}: ${slugs.length} paddles\n`);
    console.log("paddle".padEnd(42), "yt  blog tt  | counted | pos mix neg | prices");
    const totals = { yt: 0, blog: 0, tt: 0, counted: 0, prices: 0 };
    for (const s of slugs) {
      const rs = built.reviews.filter(r => r.slug === s);
      const n = (k: string) => rs.filter(r => r.platform === k).length;
      const ttChannels = new Set(rs.filter(r => r.platform === "tiktok").map(r => r.handle)).size;
      const counted = n("youtube") + n("blog") + ttChannels, st = (k: string) => rs.filter(r => r.stance === k).length;
      const pr = built.prices.filter(p => p.slug === s).length;
      totals.yt += n("youtube"); totals.blog += n("blog"); totals.tt += n("tiktok"); totals.counted += counted; totals.prices += pr;
      console.log(s.padEnd(42), String(n("youtube")).padStart(3), String(n("blog")).padStart(4), String(n("tiktok")).padStart(3), " |", String(counted).padStart(7),
        " |", String(st("pos")).padStart(3), String(st("mix")).padStart(3), String(st("neg")).padStart(3), " |", String(pr).padStart(6));
    }
    console.log("TOTAL".padEnd(42), String(totals.yt).padStart(3), String(totals.blog).padStart(4), String(totals.tt).padStart(3), " |", String(totals.counted).padStart(7), " |", "".padStart(11), " |", String(totals.prices).padStart(6));
    console.log(`\nRows: creator_pages ${built.pages.length}, creator_reviews ${built.reviews.length}, creator_prices ${built.prices.length}`);
    console.log(`Pages with tldr: ${built.pages.filter(p => (p as Row).tldr).length}; scores shown ${built.reviews.filter(r => r.score_value != null && !r.score_hidden).length}, hidden ${built.reviews.filter(r => r.score_hidden).length}; brand ties ${built.reviews.filter(r => r.brand_tie).length}; editions ${built.reviews.filter(r => r.edition).length}`);
    console.log(`Skipped from files: ${built.skipped.length}`); for (const s of built.skipped) console.log("  -", s);
    if (dups.length) { console.log(`Duplicates in files (first kept): ${dups.length}`); for (const d of dups) console.log("  -", d); }
    console.log(`No channel link (video link used instead): ${noChannel.length}`, noChannel.map(r => `${r.creator}`).filter((v, i, a) => a.indexOf(v) === i).join(", "));
    if (problems.length) { console.log(`COPY PROBLEMS: ${problems.length}`); for (const p of problems) console.log("  -", p); }
    if (bad.length) throw new Error(`${bad.length} rows without stance/summary/platform`);

    // Compare with the DB (when 0039 is applied).
    const exists = (await client`select 1 from information_schema.tables where table_schema = ${S} and table_name = 'creator_reviews'`).length > 0;
    if (exists) {
      const ids = new Set(built.reviews.map(r => r.id));
      const cur = await client.unsafe(`select id, racket_id, url from "${S}"."creator_reviews"`);
      const stale = cur.filter(r => !ids.has(r.id) && built.pages.some(p => p.racket_id === r.racket_id));
      console.log(`In DB now: ${cur.length} reviews; would insert ${built.reviews.filter(r => !cur.some(c => c.id === r.id)).length}, update ${built.reviews.filter(r => cur.some(c => c.id === r.id)).length}; in DB but not in files (left alone): ${stale.length}`);
    } else console.log("creator_* tables do not exist yet (0039 not applied): nothing compared.");

    if (withKp && flag("kp-samples")) {
      const n = Number(flag("kp-samples")), step = Math.max(1, Math.floor(built.reviews.length / n));
      console.log(`\nKey point samples (${n}):`);
      for (let i = 0; i < n; i++) { const r = built.reviews[i * step]!; console.log(`  ${r.slug.padEnd(38)} ${String(r.platform).padEnd(7)} ${String(r.creator).slice(0, 24).padEnd(24)} ${r.key_point}`); }
    }
    if (has("samples")) {
      const pick = [built.reviews.find(r => r.platform === "youtube" && r.slug.startsWith("joola")), built.reviews.find(r => r.platform === "blog"), built.reviews.find(r => r.platform === "tiktok" && r.edition)];
      for (const s of pick) console.log("\nSAMPLE", JSON.stringify(s, null, 1));
      console.log("\nSAMPLE price", JSON.stringify(built.prices[0], null, 1));
    }
    if (problems.length && apply) throw new Error("Copy problems: fix the files first.");
    if (!apply) { console.log("\nDry run only: nothing written. Re-run with --apply after the owner's OK."); return; }
    if (!exists) throw new Error("Run migrate first.");

    await client.begin(async tx => {
      const up = async (table: string, cols: string[], key: string[], rows: Row[], keep: string[] = [], soft = false) => {
        for (let i = 0; i < rows.length; i += 100) {
          const chunk = rows.slice(i, i + 100).map(r => Object.fromEntries(cols.map(c => [c, r[c] ?? null])));
          const set = cols.filter(c => !key.includes(c) && !keep.includes(c)).map(c => soft ? `"${c}" = coalesce(excluded."${c}", "${table}"."${c}")` : `"${c}" = excluded."${c}"`).join(", ");
          await tx.unsafe(`insert into "${S}"."${table}" (${cols.map(c => `"${c}"`).join(", ")})
            select ${cols.map(c => `"${c}"`).join(", ")} from json_populate_recordset(null::"${S}"."${table}", $1::json) on conflict (${key.map(k => `"${k}"`).join(", ")}) do update set ${set}`,
          [JSON.stringify(chunk)]);
        }
      };
      // Page lines written later by hand are never cleared by a re-import (null in the files keeps the DB value).
      await up("creator_pages", PAGE_COLS, ["racket_id"], built.pages, [], true);
      const REVIEW_COLS = withKp ? [...REVIEW_COLS_BASE, "key_point"] : REVIEW_COLS_BASE;
      await up("creator_reviews", REVIEW_COLS, ["racket_id", "url"], built.reviews, ["id", "created_at"]);
      await up("creator_prices", PRICE_COLS, ["racket_id", "url"], built.prices, ["id"]);
    });
    const [c] = await client.unsafe(`select (select count(*) from "${S}".creator_pages) pages, (select count(*) from "${S}".creator_reviews) reviews,
      (select count(*) from "${S}".creator_prices) prices, (select count(distinct racket_id) from "${S}".creator_reviews) paddles`);
    console.log("\nWritten. In DB now:", c);
  } finally { await client.end(); }
}
await main();
process.exit(0);
