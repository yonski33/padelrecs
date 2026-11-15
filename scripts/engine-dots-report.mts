// Trait dots before (a padel-engine-inputs.csv export from live main) and after (lib/engine engineTraitDots via match-context)
// for the most-reported rackets, with the control-power axis.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/engine-dots-report.mts before.csv [count]
import { readFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { homePayload } from "../app/home-payload";
import { engineAxis } from "../lib/home-rank";
import { niche } from "../lib/niche";
import { TRAITS } from "../lib/trait-score";

const [file, count = "10"] = process.argv.slice(2);
const lines = readFileSync(file, "utf8").trim().split("\n");
const head = lines[0].split(","), col = (row: string[], k: string) => row[head.indexOf(k)];
const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map(x => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
const before = new Map(lines.slice(1).map(split).map(r => [col(r, "slug"), r]));
const [ctx, payload] = await Promise.all([matchContext(), homePayload()]);
const axis = engineAxis(payload.items, niche.fit?.engine);
const top = [...ctx.data.listed].sort((a, b) => ctx.facts(b.id).reports - ctx.facts(a.id).reports).slice(0, Number(count));
console.log(`| Racket | reports | axis | ${TRAITS.join(" | ")} |`); console.log(`|---|---|---|${TRAITS.map(() => "---").join("|")}|`);
for (const r of top) { const b = before.get(r.slug), s = ctx.traits(r.id).scores;
  console.log(`| ${r.name} | ${ctx.facts(r.id).reports} | ${axis.get(r.id)?.toFixed(2)} | ${TRAITS.map(t => { const o = b ? col(b, `${t}_dots`) : "?", n = s?.[t]?.dots ?? "—"; return String(o) === String(n) ? `${n}` : `${o} → **${n}**`; }).join(" | ")} |`); }
const dist = Object.fromEntries(TRAITS.map(t => { const c: Record<number, number> = {}; for (const r of ctx.data.listed) { const d = ctx.traits(r.id).scores?.[t]?.dots; if (d) c[d] = (c[d] ?? 0) + 1; } return [t, c]; }));
console.log("\nDots across the catalog (after):", JSON.stringify(dist));
process.exit(0);
