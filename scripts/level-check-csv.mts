// The owner's level check sheet (2026-11-15): the most-reported rackets with the brand's level, the expert level, the suits
// scores the site now uses, and which quick-match levels each one shows for (lib/quick-match.ts passesLevel), plus an empty
// owner_level column for corrections (import those as expert levels, scripts/import-expert-sheet.mts).
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/level-check-csv.mts out.csv [count]
import { writeFileSync } from "node:fs";
import { matchContext } from "../app/match-context";
import { passesLevel, LEVELS } from "../lib/quick-match";
import { EXTRACTORS } from "../lib/evidence";
import { niche } from "../lib/niche";

const [file, n = "80"] = process.argv.slice(2);
const ctx = await matchContext();
const L = ["beginner", "intermediate", "advanced"], band = (a: number, b: number) => a === b ? L[a] : `${L[a]}-${L[b]}`;
const brandOf = new Map(ctx.evidence.filter(r => r.extractedBy === EXTRACTORS.brandLevel).map(r => { const [a, b] = (r.valueText ?? "").split("-").map(Number); return [r.productId, band(a, b)]; }));
const expertOf = (id: string) => { const e = ctx.traits(id).edits?.expert; if (!e?.suits_intermediate) return "";
  const v = [e.suits_beginner?.value, e.suits_intermediate?.value, e.suits_advanced?.value], inb = [0, 1, 2].filter(i => (v[i] ?? 0) >= 80); return inb.length ? band(inb[0], inb.at(-1)!) : ""; };
const pro = (niche.fit?.proLines ?? []).map(p => new RegExp(p, "i"));
const reports = new Map<string, number>();
for (const x of [...ctx.data.reviews, ...ctx.data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
const rows = ctx.data.listed.map(r => ({ r, n: reports.get(r.id) ?? 0 })).sort((a, b) => b.n - a.n).slice(0, Number(n));
const q = (v: string | number) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
const head = ["name", "slug", "reports", "brand_level", "expert_level", "pro_line", "suits_beginner", "suits_intermediate", "suits_advanced", "shows_for", "based_on", "owner_level"];
const lines = rows.map(({ r, n }) => { const lv = ctx.level(r.id), s = lv?.suits;
  return [r.name, r.slug, n, brandOf.get(r.id) ?? "", expertOf(r.id), pro.some(re => re.test(r.name)) ? "yes" : "", s?.beginner ?? "", s?.intermediate ?? "", s?.advanced ?? "",
    LEVELS.filter(l => passesLevel(lv, l, ctx.levelGate)).join(" + "), s?.basis.join("; ") ?? "", ""].map(q).join(","); });
writeFileSync(file, [head.join(","), ...lines].join("\n") + "\n");
console.log(`${lines.length} rows → ${file}`);
process.exit(0);
