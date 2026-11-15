// YouTube reviewers' checked notes (site-jobs youtube-*-data.jsonl: level / style / feel / arm / zone items, each with the
// reviewer's own quote) → trait mentions per racket for lib/trait-score.ts (owner 2026-11-15: "a reviewer calling it a control
// racket = a control mention"). Fixed keyword rules on the English note, so the result is repeatable; each channel counts once
// per racket and trait (its notes net out to +1, −1 or nothing). Writes db/youtube-traits/<niche>.json.
//   NICHE=padel npx tsx --env-file=.env.local scripts/youtube-trait-mentions.mts <data.jsonl> [<more.jsonl> …]
import { readFileSync, writeFileSync } from "node:fs";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { displayName } from "../lib/brand-name";
import { classifyTraitNote } from "../lib/youtube-trait-rules";
import type { Trait } from "../lib/trait-score";

const files = process.argv.slice(2);
if (!files.length) throw new Error("Usage: youtube-trait-mentions.mts <data.jsonl> …");
const data = await catalog();
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const bySlug = new Map(data.rackets.map(r => [r.slug, r.slug]));
const byName = new Map(data.rackets.flatMap(r => { const b = data.brands.find(x => x.id === r.brandId)?.name; return [[norm(displayName(r.name, b)), r.slug], [norm(`${displayName(r.name, b)} ${r.year}`), r.slug], [norm(r.name), r.slug]] as [string, string][]; }));
type Row = { racket: string; channel: string; items?: { k: string; t: string }[] };
const net = new Map<string, Map<string, Partial<Record<Trait, number>>>>(); // slug → channel → trait → sum
const unmatched = new Set<string>();
for (const f of files) for (const line of readFileSync(f, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const row = JSON.parse(line) as Row;
  const slug = bySlug.get(row.racket) ?? byName.get(norm(row.racket));
  if (!slug) { unmatched.add(row.racket); continue; }
  const ch = net.get(slug) ?? new Map(); net.set(slug, ch);
  const sums = ch.get(row.channel) ?? {}; ch.set(row.channel, sums);
  for (const it of row.items ?? []) for (const [t, v] of classifyTraitNote(it.k, it.t)) sums[t] = (sums[t] ?? 0) + v;
}
const out: Record<string, Partial<Record<Trait, { plus: number; minus: number }>>> = {};
for (const [slug, ch] of net) for (const sums of ch.values()) for (const [t, v] of Object.entries(sums) as [Trait, number][]) {
  if (!v) continue;
  const e = ((out[slug] ??= {})[t] ??= { plus: 0, minus: 0 });
  if (v > 0) e.plus++; else e.minus++;
}
writeFileSync(`db/youtube-traits/${niche.id}.json`, JSON.stringify(out, null, 1) + "\n");
console.log(`${Object.keys(out).length} rackets with YouTube trait mentions${unmatched.size ? `; not in the catalog: ${[...unmatched].join(", ")}` : ""}`);
