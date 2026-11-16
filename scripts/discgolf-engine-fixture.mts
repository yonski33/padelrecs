// DiscGolfRecs' quick match on the shared engine (PM 2026-11-16 option A), read-only. Prints the top 10s for the yardstick's
// picks and checks the yardstick (tests/fixtures/engine-yardstick-discgolf.json); with --sheet, the owner's expert sheet is laid
// over the items in memory (as match-context would read it after the import) and each list shows "was" = the rank before.
// --write saves the items as the test fixture (tests/fixtures/engine-discgolf.json; with --sheet, the after items).
//   NICHE=discgolf npx tsx --conditions=react-server --env-file=.env.local scripts/discgolf-engine-fixture.mts [--sheet f.csv] [--write]
import { readFileSync, writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { slimItems, rankHome, type RankItem } from "../lib/home-rank";
import { niche } from "../lib/niche";
import { levelToSuits } from "../db/trait-override";
import { expertValues, type SheetRow } from "../lib/discgolf-expert";
import { readPick, yardstickResults, type Yardstick } from "../lib/discgolf-yardstick";

const args = process.argv.slice(2), sheetAt = args.indexOf("--sheet");
const { items, finder, data } = await matchContext();
const name = new Map(data.rackets.map(r => [r.id, r.name])), slugOf = new Map(data.rackets.map(r => [r.id, r.slug]));
const before: RankItem[] = slimItems(items, finder);
let after: RankItem[] | null = null, applied = 0;
/** A CSV cell split that keeps quoted commas. */
const cells = (l: string) => { const out: string[] = []; let c = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i];
  if (q) { if (ch === '"' && l[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ",") { out.push(c); c = ""; } else c += ch; }
  out.push(c); return out; };
if (sheetAt >= 0) {
  const [head, ...lines] = readFileSync(args[sheetAt + 1], "utf8").replace(/^﻿/, "").trim().split(/\r?\n/).map(cells);
  const bySlug = new Map(lines.map(l => [l[head.indexOf("slug")], Object.fromEntries(head.map((h, i) => [h, l[i] ?? ""])) as SheetRow]));
  after = before.map(x => {
    const r = bySlug.get(slugOf.get(x.id) ?? ""); if (!r) return x;
    const ex = expertValues(r), su = levelToSuits(r.expert_level);
    if (!Object.keys(ex).length && !su) return x;
    applied++;
    // As app/match-context.ts reads them: expert traits into the engine's facts, an expert level over the suits scores.
    const level = su ? { liked: {}, ...x.level, suits: { beginner: 50, intermediate: 50, advanced: 50, ...x.level?.suits, ...su } } : x.level;
    return { ...x, ...(x.eng ? { eng: { ...x.eng, expert: { ...x.eng.expert, ...ex } } } : {}), ...(level ? { level } : {}) };
  });
}
const setup = { ...finder, levelGate: niche.fit?.levelGate, engine: niche.fit?.engine };
const BAD = niche.tags.filter(t => t.tone === "neg").map(t => t.label);
const Y = JSON.parse(readFileSync("tests/fixtures/engine-yardstick-discgolf.json", "utf8")) as Yardstick;
const picks = [...new Set([...Y.beats.map(b => b.pick), ...Y.not_top.map(b => b.pick), "distance.beginner.any.1", "putter.intermediate.any.0"])];
const top = (its: RankItem[], pick: string) => rankHome(its, setup, BAD, readPick(pick), false, 10).rows;
for (const pick of picks) {
  const b = top(before, pick), a = after ? top(after, pick) : null, pos = new Map(b.map((r, i) => [r.id, i + 1]));
  console.log(`\n## ${pick}`);
  (a ?? b).forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${name.get(r.id)} ${r.pct ?? "—"}%${a ? `  (was ${pos.get(r.id) ?? "–"})` : ""}`));
}
for (const [label, its] of [["before", before], ...(after ? [["after", after]] : [])] as [string, RankItem[]][]) {
  const res = yardstickResults(its, setup, BAD, Y, id => name.get(id) ?? id);
  console.log(`\nyardstick ${label}: ${res.filter(r => r.ok).length}/${res.length}${res.filter(r => !r.ok).map(r => `\n  ✗ ${r.what}`).join("")}`);
}
if (after) console.log(`\nsheet: expert values on ${applied} discs`);
if (args.includes("--write")) {
  writeFileSync("tests/fixtures/engine-discgolf.json", JSON.stringify({ names: Object.fromEntries((after ?? before).map(x => [x.id, name.get(x.id)])), items: after ?? before }));
  console.log(`wrote tests/fixtures/engine-discgolf.json (${before.length} discs)`);
}
process.exit(0);
