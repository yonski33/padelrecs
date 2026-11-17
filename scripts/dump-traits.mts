// Every listed product's trait dots, Player score, style lean, "best for" and fit facts for one site, as JSON (audit checks).
//   NICHE=<id> npx tsx --conditions=react-server --env-file=.env.local scripts/dump-traits.mts <out.json>
import { writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { bestFor, styleOf } from "../lib/fit-verdict";
const ctx = await matchContext();
const out: Record<string, unknown> = {};
for (const r of ctx.data.listed) {
  const sc = ctx.traits(r.id).scores ?? {}, f = ctx.facts(r.id);
  out[r.slug] = { name: r.name, signal: ctx.signal(r.id), reports: f.reports, dots: Object.fromEntries(Object.entries(sc).map(([k, v]) => [k, (v as { dots: number } | null)?.dots ?? null])),
    style: styleOf(f), best: bestFor(f), suits: f.suits ? { b: f.suits.beginner, i: f.suits.intermediate, a: f.suits.advanced } : null, hard: f.hard ?? null };
}
writeFileSync(process.argv[2], JSON.stringify(out));
process.exit(0);
