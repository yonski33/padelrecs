// Top 10 for the 9 level × style quick-match picks, with each row's report count and Player score, as the browser ranks them
// (home payload → lib/home-rank.ts). Used to check the confidence change (owner 2026-11-15: well-liked, well-reviewed
// rackets first). Writes JSON; prints a compact table.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/rank-confidence-report.mts out.json
import { writeFileSync } from "node:fs";
import { homePayload } from "../app/home-payload";
import { rankHome } from "../lib/home-rank";
import { niche } from "../lib/niche";
import { LEVELS, type QuickChoice } from "../lib/quick-match";
const payload = await homePayload();
const { items, cards } = JSON.parse(JSON.stringify(payload)) as typeof payload;
const byId = new Map(items.map(x => [x.id, x]));
const bad = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
const out = LEVELS.flatMap(level => (["control", "balance", "power"] as const).map(style => {
  const choice: QuickChoice = { style, level, arm: false };
  const { rows } = rankHome(items, { ...niche.finder!, levelGate: niche.fit?.levelGate }, bad, choice, false);
  return { pick: `${level}+${style}`, rows: rows.map(r => ({ name: cards[r.id].name, reports: byId.get(r.id)!.facts.reports, score: byId.get(r.id)!.signal, pct: r.pct, kind: r.fit?.kind ?? null })) };
}));
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
for (const c of out) { console.log(`\n## ${c.pick}`); c.rows.forEach((r, i) => console.log(`${i + 1}. ${r.name} · ${r.reports} rep · PS ${r.score ?? "—"} · ${r.pct ?? "—"}%`)); }
process.exit(0);
