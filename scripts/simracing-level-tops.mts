// The home's top 5 per product type for each level pick (new / serious / all-in), as the v2 home ranks them (lib/home-rank.ts
// rankHome over app/match-context.ts items), for the owner's check of the level mapping (PM 2026-11-16). Read-only.
//   [SIM_GATE_ONLY=1] NICHE=simracing npx tsx --conditions=react-server --env-file=.env.local scripts/simracing-level-tops.mts
import { matchContext } from "../app/match-context";
import { rankHome } from "../lib/home-rank";
import { niche } from "../lib/niche";
import { LEVELS, levelLabel } from "../lib/quick-match";
import { SIM_TYPES, SIMRACING_FIT } from "../lib/simracing-fit";
// SIM_GATE_ONLY=1: the level only gates the list (the version before the level took the style slot), for the comparison.
if (process.env.SIM_GATE_ONLY) delete SIMRACING_FIT.quick!.levelStyle;
const { data, items, finder, bad } = await matchContext();
const setup = { ...finder, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
const name = (id: string) => data.rackets.find(r => r.id === id)?.name ?? id;
for (const [kind, , many] of SIM_TYPES) {
  console.log(`\n## ${many}`);
  for (const level of [undefined, ...LEVELS]) {
    const { rows } = rankHome(items, setup, bad, { style: "any", arm: false, kind, ...(level ? { level } : {}) }, false, 5);
    console.log(`${(level ? levelLabel(level) : "no level").padEnd(9)} ${rows.map(r => `${name(r.id)} ${r.pct ?? "—"}%`).join(" · ") || "—"}`);
  }
}
process.exit(0);
