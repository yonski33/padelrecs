// The owner's calls (db/known-dots/<niche>.json) as a locked check against the live evidence (ENGINE-PLAN.md section F):
// fails when computed dots break a `min` / `exact`. Prints both the auto dots (from evidence alone) and the shown dots
// (with hand-set calls), so a call that only holds by hand is visible.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/check-known-dots.mts
import { readFileSync } from "node:fs";
import { catalog } from "../db/data";
import { niche } from "../lib/niche";
import { matchContext } from "../app/match-context";
const known = JSON.parse(readFileSync(`db/known-dots/${niche.id}.json`, "utf8")) as Record<string, Record<string, { dots?: number; min?: number; exact?: number }>>;
const [data, ctx] = await Promise.all([catalog(), matchContext()]);
let fail = 0;
for (const [slug, traits] of Object.entries(known)) {
  if (slug.startsWith("_")) continue;
  const r = data.rackets.find(x => x.slug === slug);
  if (!r) { console.log(`MISSING ${slug}`); fail++; continue; }
  const t = ctx.traits(r.id);
  for (const [trait, want] of Object.entries(traits)) {
    if (trait.startsWith("_") || (want.min === undefined && want.exact === undefined && want.dots === undefined)) continue;
    const k = trait as keyof NonNullable<typeof t.scores>, shown = t.scores?.[k]?.dots, auto = t.auto?.[k]?.dots;
    const ok = shown !== undefined && (want.min === undefined || shown >= want.min) && (want.exact === undefined || shown === want.exact);
    if (!ok) fail++;
    console.log(`${ok ? "ok  " : "FAIL"} ${slug} ${trait}: shown ${shown} (auto ${auto})${want.min !== undefined ? ` want ≥${want.min}` : ""}${want.exact !== undefined ? ` want ${want.exact}` : ""}${want.dots !== undefined ? " · hand-set" : ""}`);
  }
}
console.log(fail ? `${fail} known calls broken` : "all known calls hold");
process.exit(fail ? 1 : 0);
