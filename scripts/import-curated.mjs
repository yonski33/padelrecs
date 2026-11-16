#!/usr/bin/env node
// Imports the owner-reviewed curated top 10s (Grok pack, `validate_curated.py … --split`: one curated-<combo>.json per list,
// { combo: "control-beginner-noarm", picks: [{ slug, reason, source, … }] }) into db/curated/<site>.json, the file the match
// list reads (lib/curated.ts). Only the combinations in the folder change; the others stay as they are. Each slug becomes the
// newest year of its model with 10+ reviews (newestOf), from the pack's catalog in the same folder.
//   node scripts/import-curated.mjs <folder> [site=padel] [--write]     (without --write: a dry run that prints the changes)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** "control-beginner-noarm" → "control/beginner/arm-off"; null for anything else. */
export function keyOf(combo) {
  const m = /^(control|balance|power)-(beginner|intermediate|advanced)-(noarm|arm)$/.exec(combo ?? "");
  return m ? `${m[1]}/${m[2]}/arm-${m[3] === "arm" ? "on" : "off"}` : null;
}
/** One pack file as a curated list: the slugs in order, each with its reason as the note and its source. */
export function listOf(file) {
  const picks = Array.isArray(file?.picks) ? file.picks : [];
  const seen = new Set();
  return picks.filter(p => p?.slug && !seen.has(p.slug) && seen.add(p.slug))
    .map(p => ({ slug: p.slug, ...(p.owner ? { owner: true } : {}), ...(p.reason ? { note: String(p.reason) } : {}), ...(p.source ? { src: String(p.source) } : {}), ...(p.exception ? { exception: String(p.exception) } : {}) }));
}

/** The owner's rule (2026-11-17, "we always pick the new version, if it has enough reviews"): a slug becomes the newest year of
 *  its model (same slug without the year) with 10+ reviews; when no year has that many, the newest year. `catalog`: the pack's
 *  catalog ({ slug, reviews }). Unknown slugs stay as written. */
export function newestOf(slug, catalog, min = 10) {
  const stem = s => s.replace(/-20\d\d$/, ""), year = s => Number(/-(20\d\d)$/.exec(s)?.[1] ?? 0);
  const same = catalog.filter(r => stem(r.slug) === stem(slug)).sort((a, b) => year(b.slug) - year(a.slug));
  if (!same.length) return slug;
  return (same.find(r => (r.reviews ?? 0) >= min) ?? same[0]).slug;
}

function main() {
  const [dir, site = "padel", ...rest] = process.argv.slice(2), write = rest.includes("--write") || site === "--write";
  const s = site === "--write" ? "padel" : site;
  if (!dir) { console.error("usage: node scripts/import-curated.mjs <folder> [site] [--write]"); process.exit(2); }
  const path = new URL(`../db/curated/${s}.json`, import.meta.url), doc = JSON.parse(readFileSync(path, "utf8"));
  // The pack's catalog (reviews per slug), for the newest-model rule.
  let catalog = [];
  try { catalog = JSON.parse(readFileSync(join(dir, `${s}-curated-pack.json`), "utf8")).catalog ?? []; } catch { console.log(`! no ${s}-curated-pack.json in the folder: slugs kept as written`); }
  let changed = 0;
  // The owner's final file (curated-final.json: { lists: { combo: [{ slug }] } }) wins over the per-list drafts; every pick in
  // it is the owner's, kept exactly as written (no newest-model swap: owner picks are exact).
  let files;
  try { const fin = JSON.parse(readFileSync(join(dir, "curated-final.json"), "utf8"));
    files = Object.entries(fin.lists ?? {}).map(([combo, picks]) => ({ name: `curated-final.json ${combo}`, file: { combo, picks: picks.map(p => ({ ...p, owner: true })) } })); }
  catch { files = readdirSync(dir).filter(f => /^curated-(?!final).+\.json$/.test(f)).sort().map(f => ({ name: f, file: JSON.parse(readFileSync(join(dir, f), "utf8")) })); }
  for (const { name: f, file } of files) {
    const key = keyOf(file.combo);
    if (!key || !(key in doc.lists)) { console.log(`skip ${f}: unknown combo ${file.combo}`); continue; }
    const list = listOf(file).map(e => { const n = e.owner ? e.slug : newestOf(e.slug, catalog); if (n !== e.slug) console.log(`  ${e.slug} → ${n} (newest with 10+ reviews)`); return { ...e, slug: n }; })
      .filter((e, i, all) => all.findIndex(o => o.slug === e.slug) === i), before = (doc.lists[key] ?? []).map(e => e.slug).join(",");
    if (list.length !== 10) console.log(`! ${key}: ${list.length} picks (10 expected)`);
    if (before === list.map(e => e.slug).join(",")) continue;
    changed++; console.log(`${key}: ${before ? "replace" : "new"} → ${list.map(e => e.slug).join(", ")}`);
    doc.lists[key] = list;
  }
  if (write && changed) writeFileSync(path, JSON.stringify(doc, null, 1) + "\n");
  console.log(`${changed} list(s) ${write ? "written to" : "would change in"} db/curated/${s}.json${write ? "" : " (dry run; add --write)"}`);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
