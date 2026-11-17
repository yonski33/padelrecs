// SimRacingRecs: the torque level cap's dry run (PM / Grok audit 2026-11-17 #14–#16). Read-only. Prints every wheelbase's
// "best for" before and after the cap (lib/simracing-fit.ts simracingLevelCap), and the "new" top 5 before and after.
//   SIM_NO_CAP=1 NICHE=simracing npx tsx … (first, the "now" side), then without it:
//   NICHE=simracing npx tsx --conditions=react-server --env-file=.env.local scripts/simracing-level-cap.mts
import { readFileSync, writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { rankHome } from "../lib/home-rank";
import { bestFor } from "../lib/fit-verdict";
import { niche } from "../lib/niche";
import { SIMRACING_FIT } from "../lib/simracing-fit";

const run = async () => {
  const ctx = await matchContext(), setup = { ...ctx.finder, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
  const wb = ctx.data.listed.filter(r => r.shape === "Wheelbase");
  const best = new Map(wb.map(r => [r.id, bestFor(ctx.facts(r.id)).join(", ")]));
  const top = rankHome(ctx.items, setup, ctx.bad, { style: "any", arm: false, kind: "wheelbase", level: "beginner" }, false, 5).rows.map(r => `${ctx.data.rackets.find(x => x.id === r.id)!.name} ${r.pct}%`);
  return { wb, best, top };
};
// Two processes (matchContext is cached per process): SIM_NO_CAP=1 dumps the "now" side for the comparison.
const SCRATCH = process.env.SIM_CAP_DUMP ?? "/tmp/simracing-level-cap-before.json";
if (process.env.SIM_NO_CAP) { delete SIMRACING_FIT.levelCap; const b = await run(); writeFileSync(SCRATCH, JSON.stringify({ best: [...b.best], top: b.top })); process.exit(0); }
const dumped = JSON.parse(readFileSync(SCRATCH, "utf8")) as { best: [string, string][]; top: string[] };
const after = await run(), before = { wb: after.wb, best: new Map(dumped.best), top: dumped.top };
const rows = before.wb.map(r => ({ name: r.name, torque: r.weight ?? "?", before: before.best.get(r.id) ?? "", after: after.best.get(r.id) ?? "" }))
  .sort((a, b) => (parseFloat(a.torque) || 0) - (parseFloat(b.torque) || 0));
const changed = rows.filter(r => r.before !== r.after);
const out = [`# Wheelbase "best for" from torque: dry run (${new Date().toISOString().slice(0, 10)})`, "",
  "Rule: under 6 Nm new; 6–12 Nm new → serious; 12 Nm and up serious → all-in. Read-only; no database write (it is a rule on the page).", "",
  `${changed.length} of ${rows.length} wheelbases change.`, "", "| Wheelbase | Torque | Best for now | Best for after |", "|---|---|---|---|",
  ...changed.map(r => `| ${r.name} | ${r.torque} | ${r.before || "—"} | ${r.after || "—"} |`), "",
  "## Unchanged", "", rows.filter(r => r.before === r.after).map(r => `${r.name} (${r.torque}): ${r.after || "—"}`).join("; "), "",
  "## \"New\" wheelbases, top 5", "", `- now: ${before.top.join(" · ")}`, `- after: ${after.top.join(" · ")}`, ""];
writeFileSync(process.argv[2] ?? "simracing-level-cap-dryrun.md", out.join("\n"));
console.log(out.slice(0, 12).join("\n"));
process.exit(0);
