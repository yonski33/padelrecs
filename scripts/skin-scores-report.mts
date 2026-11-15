// The skin scores at a glance (read-only): coverage per attribute and the top products for each skin type.
//   NICHE=skin npx tsx --conditions=react-server --env-file=.env.local scripts/skin-scores-report.mts [--csv out.csv]
import { writeFileSync } from "node:fs";
import { catalog } from "../db/data";
import { evidenceRows } from "../db/evidence";
import { niche } from "../lib/niche";
import { attrProfileFor } from "../lib/attr-profile";
import { scoreAll, attrWords } from "../lib/attr-score";
const profile = attrProfileFor(niche)!;
const [data, rows] = await Promise.all([catalog(), evidenceRows()]);
const cnt = new Map(data.listed.map(r => [r.id, { n: 0, p: 0, neg: 0, j: 0 }]));
for (const r of data.reviews) { const c = cnt.get(r.racketId); if (c) { c.n++; c.j++; if (r.rating >= 4) c.p++; else if (r.rating <= 2) c.neg++; } }
for (const e of data.external) { const c = cnt.get(e.racketId); if (c) { c.n++; if (e.sentiment) { c.j++; if (e.sentiment === "positive") c.p++; if (e.sentiment === "negative") c.neg++; } } }
const attrs = scoreAll(profile, data.listed.map(r => { const c = cnt.get(r.id)!; return { id: r.id, shape: r.shape, reports: c.n, verdict: c.j ? (c.p - c.neg) / c.j : null }; }), rows);
const name = new Map(data.listed.map(r => [r.id, r.name]));
for (const a of profile.attrs) {
  const have = data.listed.filter(r => a.kind === "fact" ? attrs.get(r.id)!.facts[a.key] != null : !!attrs.get(r.id)!.scores[a.key]);
  console.log(`${a.key.padEnd(18)} ${a.kind.padEnd(8)} ${have.length}/${data.listed.length}`);
}
for (const g of ["dry", "oily", "sensitive", "acne", "combination"]) {
  const top = data.listed.map(r => ({ r, s: attrs.get(r.id)!.scores[`suits_${g}`] })).filter(x => x.s).sort((a, b) => b.s!.score - a.s!.score);
  console.log(`\n${g}: best ${top.slice(0, 4).map(x => `${x.r.name} ${x.s!.score} (${x.s!.n})`).join(" · ")}\n   worst ${top.slice(-3).map(x => `${x.r.name} ${x.s!.score} (${x.s!.n})`).join(" · ")}`);
}
const csv = process.argv.indexOf("--csv");
if (csv > 0) {
  const keys = profile.attrs.map(a => a.key);
  writeFileSync(process.argv[csv + 1], ["product,type," + keys.join(","), ...data.listed.map(r => { const a = attrs.get(r.id)!; return [JSON.stringify(name.get(r.id)), r.shape, ...keys.map(k => a.scores[k]?.score ?? a.facts[k] ?? "")].join(","); })].join("\n"));
}
void attrWords;
process.exit(0);
