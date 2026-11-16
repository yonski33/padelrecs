#!/usr/bin/env node
// Imports the owner-reviewed curated top 10s (Grok pack, `validate_curated.py … --split`: one curated-<combo>.json per list,
// { combo: "control-beginner-noarm", picks: [{ slug, reason, source, … }] }) into db/curated/<site>.json, the file the match
// list reads (lib/curated.ts). Only the combinations in the folder change; the others stay as they are.
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
    .map(p => ({ slug: p.slug, ...(p.reason ? { note: String(p.reason) } : {}), ...(p.source ? { src: String(p.source) } : {}) }));
}

function main() {
  const [dir, site = "padel", ...rest] = process.argv.slice(2), write = rest.includes("--write") || site === "--write";
  const s = site === "--write" ? "padel" : site;
  if (!dir) { console.error("usage: node scripts/import-curated.mjs <folder> [site] [--write]"); process.exit(2); }
  const path = new URL(`../db/curated/${s}.json`, import.meta.url), doc = JSON.parse(readFileSync(path, "utf8"));
  let changed = 0;
  for (const f of readdirSync(dir).filter(f => /^curated-.+\.json$/.test(f)).sort()) {
    const file = JSON.parse(readFileSync(join(dir, f), "utf8")), key = keyOf(file.combo);
    if (!key || !(key in doc.lists)) { console.log(`skip ${f}: unknown combo ${file.combo}`); continue; }
    const list = listOf(file), before = (doc.lists[key] ?? []).map(e => e.slug).join(",");
    if (list.length !== 10) console.log(`! ${key}: ${list.length} picks (10 expected)`);
    if (before === list.map(e => e.slug).join(",")) continue;
    changed++; console.log(`${key}: ${before ? "replace" : "new"} → ${list.map(e => e.slug).join(", ")}`);
    doc.lists[key] = list;
  }
  if (write && changed) writeFileSync(path, JSON.stringify(doc, null, 1) + "\n");
  console.log(`${changed} list(s) ${write ? "written to" : "would change in"} db/curated/${s}.json${write ? "" : " (dry run; add --write)"}`);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
