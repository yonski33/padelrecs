// "Praise" out of a site's stored copy (owner 2026-11-28, via the PM): a script-only swap (lib/no-praise.ts), no LLM calls.
// Dry run by default: counts per table and field, every change and every flagged text, written to <out>. Nothing is written
// to the files or the database without --apply, and --apply first backs up every row it will touch to <out>/backup.json.
//   NICHE=pickleball npx tsx --env-file=.env.local scripts/no-praise.mts <out-dir> [--apply] [--no-extra]
// Text covered: db/creators/reviewer-wrapups.json (paras, blocks, highlights), reddit-roundups.json (headline, tags, paras;
// its highlights are players' own words and are never changed: a swap that would break one is flagged), tldrs.json,
// compare-lines.json; creator_pages (tldr, group lines) and creator_reviews (summary, more, short, stood out, trade-off,
// compared to, key point, note, highlights). A creator's own quote is never changed.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { niche } from "../lib/niche";
import { noPraise, PRAISE_RE } from "../lib/no-praise";

const args = process.argv.slice(2), out = args.find(a => !a.startsWith("--"));
if (!out) throw new Error("Give an output folder");
const APPLY = args.includes("--apply"), EXTRA = !args.includes("--no-extra"), site = niche.id, S = niche.schema;
type Change = { table: string; key: string; field: string; before: string; after: string; rules: string[] };
type Flag = { table: string; key: string; field: string; text: string; why: string[] };
const changes: Change[] = [], flags: Flag[] = [], quotes: { key: string; text: string }[] = [];
const sw = (table: string, key: string, field: string, t: string | null | undefined): string | null | undefined => {
  if (!t || !PRAISE_RE.test(t)) return t;
  const r = noPraise(t, EXTRA);
  if (r.flags.length) { flags.push({ table, key, field, text: t, why: r.flags }); return t; }
  if (r.changed) changes.push({ table, key, field, before: t, after: r.text, rules: r.rules });
  return r.text;
};

// ---- JSON files ----
const file = (n: string) => join("db/creators", `${n}.json`);
const load = async (n: string) => JSON.parse(await readFile(file(n), "utf8"));
const files: Record<string, unknown> = {};
const wr = await load("reviewer-wrapups"), rr = await load("reddit-roundups"), tl = await load("tldrs"), cl = await load("compare-lines");
type Wrap = { paras: string[]; highlights: { text: string; tone: string }[]; blocks?: { label: string; text: string }[] };
const wrBefore = JSON.parse(JSON.stringify(wr[site] ?? {})) as Record<string, Wrap>;
for (const [slug, w] of Object.entries((wr[site] ?? {}) as Record<string, Wrap>)) {
  w.paras = w.paras.map((p, i) => sw("wrapups", slug, `paras[${i}]`, p)!);
  w.blocks?.forEach((b, i) => { b.text = sw("wrapups", slug, `blocks[${i}]`, b.text)!; });
  w.highlights.forEach((h, i) => { h.text = sw("wrapups", slug, `highlights[${i}]`, h.text)!; });
  // Every highlight must still be found in the text it marks.
  const all = [...w.paras, ...(w.blocks ?? []).map(b => b.text)].join(" ");
  for (const h of w.highlights) if (!all.includes(h.text) && PRAISE_RE.test(JSON.stringify(wrBefore[slug] ?? ""))) flags.push({ table: "wrapups", key: slug, field: "highlight lost", text: h.text, why: ["highlight no longer found"] });
}
type Rd = { headline: string; tags: { text: string }[]; paras: string[]; highlights: { text: string }[] };
for (const [slug, r] of Object.entries((rr[site] ?? {}) as Record<string, Rd>)) {
  r.headline = sw("reddit", slug, "headline", r.headline)!;
  r.tags.forEach((t, i) => { t.text = sw("reddit", slug, `tags[${i}]`, t.text)!; });
  const old = [...r.paras];
  r.paras = r.paras.map((p, i) => sw("reddit", slug, `paras[${i}]`, p)!);
  // Players' own words: a swap inside one would change a quote, so that paragraph goes back and is flagged.
  r.paras = r.paras.map((p, i) => { const lost = r.highlights.filter(h => old[i]!.includes(h.text) && !p.includes(h.text));
    if (!lost.length) return p;
    const k = changes.findIndex(c => c.table === "reddit" && c.key === slug && c.field === `paras[${i}]`); if (k >= 0) changes.splice(k, 1);
    flags.push({ table: "reddit", key: slug, field: `paras[${i}]`, text: old[i]!, why: ["inside a player's quote"] }); return old[i]!; });
  for (const h of r.highlights) if (PRAISE_RE.test(h.text)) quotes.push({ key: `reddit ${slug}`, text: h.text });
}
for (const [slug, t] of Object.entries((tl[site] ?? {}) as Record<string, string>)) tl[site][slug] = sw("tldrs", slug, "tldr", t);
for (const [slug, m] of Object.entries((cl[site] ?? {}) as Record<string, Record<string, { line: string }>>))
  for (const [o, x] of Object.entries(m)) x.line = sw("compare-lines", `${slug} vs ${o}`, "line", x.line)!;
Object.assign(files, { "reviewer-wrapups": wr, "reddit-roundups": rr, tldrs: tl, "compare-lines": cl });

// ---- Database ----
const { connect } = await import("./connection");
const { client } = connect();
const RF = ["summary", "summary_more", "summary_short", "stood_out", "trade_off", "compared_to", "key_point", "note"] as const;
const pages = await client.unsafe(`select racket_id, tldr, group_pos, group_mix, group_neg from "${S}".creator_pages
  where concat_ws(' ', tldr, group_pos, group_mix, group_neg) ~* 'prais'`);
const reviews = await client.unsafe(`select id, racket_id, quote, highlights, ${RF.join(", ")} from "${S}".creator_reviews
  where concat_ws(' ', quote, array_to_string(highlights, ' '), ${RF.join(", ")}) ~* 'prais'`);
const pageUpd: { id: string; set: Record<string, string> }[] = [], revUpd: { id: string; set: Record<string, unknown> }[] = [];
for (const p of pages) { const set: Record<string, string> = {};
  for (const f of ["tldr", "group_pos", "group_mix", "group_neg"]) { const v = p[f] as string | null, n = sw("creator_pages", p.racket_id, f, v); if (n !== v) set[f] = n!; }
  if (Object.keys(set).length) pageUpd.push({ id: p.racket_id, set }); }
for (const r of reviews) { const set: Record<string, unknown> = {};
  for (const f of RF) { const v = r[f] as string | null, n = sw("creator_reviews", r.id, f, v); if (n !== v) set[f] = n; }
  const hl = (r.highlights as string[]).map((h, i) => sw("creator_reviews", r.id, `highlights[${i}]`, h)!);
  if (hl.some((h, i) => h !== r.highlights[i])) set.highlights = hl;
  const text = [set.summary ?? r.summary, set.summary_more ?? r.summary_more].join(" ");
  const was = [r.summary, r.summary_more].join(" ");
  for (const [i, h] of hl.entries()) if (was.includes(r.highlights[i]) && !text.includes(h)) flags.push({ table: "creator_reviews", key: r.id, field: "highlight lost", text: h, why: ["highlight no longer found"] });
  if (r.quote && PRAISE_RE.test(r.quote)) quotes.push({ key: r.id, text: r.quote });
  if (Object.keys(set).length) revUpd.push({ id: r.id, set }); }

// ---- Report ----
await mkdir(out, { recursive: true });
const count = (xs: { table: string; field: string }[]) => xs.reduce((a, x) => { const k = `${x.table} · ${x.field.replace(/\[\d+\]/, "")}`; a[k] = (a[k] ?? 0) + 1; return a; }, {} as Record<string, number>);
const rules = changes.flatMap(c => c.rules).reduce((a, r) => { a[r] = (a[r] ?? 0) + 1; return a; }, {} as Record<string, number>);
await writeFile(join(out, `${site}-report.json`), JSON.stringify({ site, extra: EXTRA, changes: changes.length, flags: flags.length,
  quotesLeft: quotes.length, byField: count(changes), flagsByField: count(flags), rules, changeList: changes, flagList: flags, quotes }, null, 1));
console.log(JSON.stringify({ site, changes: changes.length, flags: flags.length, quotesLeft: quotes.length, byField: count(changes), flagsByField: count(flags), rules }, null, 1));

if (APPLY) {
  // Back up every row and file this run touches, then write.
  const backup = { at: new Date().toISOString(), pages: pages.filter(p => pageUpd.some(u => u.id === p.racket_id)),
    reviews: reviews.filter(r => revUpd.some(u => u.id === r.id)),
    files: Object.fromEntries(await Promise.all(Object.keys(files).map(async n => [n, JSON.parse(await readFile(file(n), "utf8"))[site]]))) };
  await writeFile(join(out, `${site}-backup.json`), JSON.stringify(backup, null, 1));
  for (const [n, d] of Object.entries(files)) await writeFile(file(n), `${JSON.stringify(d, null, 1)}\n`);
  await client.begin(async tx => {
    for (const u of pageUpd) await tx`update ${tx(S)}.creator_pages set ${tx(u.set)} where racket_id = ${u.id}`;
    for (const u of revUpd) await tx`update ${tx(S)}.creator_reviews set ${tx(u.set as Record<string, string>)} where id = ${u.id}`;
  });
  console.log(`Applied: ${pageUpd.length} creator_pages rows, ${revUpd.length} creator_reviews rows, ${Object.keys(files).length} files.`);
}
await client.end();
