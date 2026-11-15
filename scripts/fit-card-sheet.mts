// Prints the fit card's lines for a few pick combos per racket (the owner's review sheet), with the live verdict and %.
//   NICHE=padel npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/fit-card-sheet.mts > sheet.md
import { matchContext } from "../app/match-context";
import { fitVerdict } from "../lib/fit-verdict";
import { cardLines } from "../lib/fit-card";
import { cardContent } from "../lib/fit-card-data";
import { displayName } from "../lib/brand-name";
import fitCard from "../db/fit-card/padel.json";
import type { QuickChoice } from "../lib/quick-match";

const COMBOS: [string, QuickChoice][] = [
  ["Control · intermediate", { style: "control", level: "intermediate", arm: false }],
  ["Power · advanced", { style: "power", level: "advanced", arm: false }],
  ["Balance · beginner · sore arm", { style: "balance", level: "beginner", arm: true }],
];
const ctx = await matchContext();
const name = (slug: string) => { const r = ctx.data.rackets.find(x => x.slug === slug); const b = r && ctx.data.brands.find(x => x.id === r.brandId); return r ? displayName(r.name, b?.name) : slug; };
for (const slug of Object.keys(fitCard)) {
  const r = ctx.data.rackets.find(x => x.slug === slug);
  if (!r) { console.log(`## ${slug} — not in catalog\n`); continue; }
  const content = cardContent(slug, "padel")!;
  console.log(`## ${name(slug)}\n`);
  for (const [label, c] of COMBOS) {
    const v = fitVerdict(c, ctx.factsFor(c, r.id)), pct = ctx.matchPct(c).get(r.id);
    const word = { good: "Strong fit", maybe: "Decent fit", no: "Weak fit", thin: "not enough reports" }[v.kind];
    const { strengths, catches, lead } = cardLines(content, c, { maxCatches: v.kind === "good" ? 1 : 2, hard: v.kind === "no" ? v.reasons[0] : undefined });
    console.log(`**${label}** — ${pct ?? "—"}% · ${word}\n`);
    console.log(`${v.kind === "no" ? "✓ What works" : "✓ Why it fits"}`);
    for (const s of strengths) console.log(`- ${s.t}`);
    console.log(`\n↗ What to consider`);
    if (lead) console.log(`- ${lead} *(from the fit check)*`);
    for (const k of catches) {
      console.log(`- ${k.t}`);
      if (k.note?.kind === "tip") console.log(`  - 💡 ${k.note.tip.label}: ${k.note.tip.t}`);
      if (k.note?.kind === "alt") console.log(`  - → ${k.note.alt.t} *(links to ${name(k.note.alt.slug)})*`);
    }
    console.log("");
  }
}
process.exit(0);
