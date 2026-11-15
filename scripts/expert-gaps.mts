// Rackets that still lack data after the fit check's bar (lib/niche fit.minReports), for the owner's expert to fill in
// (owner 2026-11-15). One row per listed racket with a gap: reports, evidence rows, what's missing, and blank expert columns
// (traits 1–10, level) that scripts/import-expert-csv.mts (or the admin grid's import) reads back. Read-only.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/expert-gaps.mts <out.csv>
import { writeFileSync } from "node:fs";
import { catalog } from "../db/data";
import { evidenceRows } from "../db/evidence";
import { matchContext } from "../app/match-context";
import { MIN_FIT_REPORTS } from "../lib/fit-verdict";
import { TRAITS } from "../lib/trait-score";
import { displayName } from "../lib/brand-name";

const [out] = process.argv.slice(2);
if (!out) throw new Error("Usage: expert-gaps.mts <out.csv>");
const [data, ctx, ev] = await Promise.all([catalog(), matchContext(), evidenceRows()]);
const evN = new Map<string, number>(); for (const r of ev) evN.set(r.productId, (evN.get(r.productId) ?? 0) + 1);
const reports = new Map<string, number>(); for (const x of [...data.reviews, ...data.external]) reports.set(x.racketId, (reports.get(x.racketId) ?? 0) + 1);
const csv = (v: string | number) => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
const head = ["name", "slug", "reports", "evidence_rows", "missing", ...TRAITS.map(t => `expert_${t}`), "expert_level", "notes"];
const rows: string[][] = [];
for (const r of data.listed) {
  const n = reports.get(r.id) ?? 0, t = ctx.traits(r.id).scores, lv = ctx.level(r.id);
  const missing: string[] = [];
  if (n < MIN_FIT_REPORTS) missing.push("fit verdict");
  const basis = (lv as { suits?: { basis?: string[] } } | undefined)?.suits?.basis ?? [];
  if (!basis.some(b => b !== "the brand")) missing.push("level");
  const thin = TRAITS.filter(x => t?.[x]?.basis !== "players");
  if (thin.length) missing.push(`${thin.join("/")} thin`);
  if (!missing.length) continue;
  rows.push([displayName(r.name, data.brands.find(b => b.id === r.brandId)?.name), r.slug, String(n), String(evN.get(r.id) ?? 0), missing.join(" · "), ...TRAITS.map(() => ""), "", ""]);
}
rows.sort((a, b) => Number(a[2]) - Number(b[2]) || a[1].localeCompare(b[1]));
writeFileSync(out, [head, ...rows].map(r => r.map(csv).join(",")).join("\n") + "\n");
const only = (k: string) => rows.filter(r => r[4].includes(k)).length;
console.log(`${rows.length} of ${data.listed.length} rackets have gaps → ${out}`);
console.log(`  no fit verdict (<${MIN_FIT_REPORTS} reports): ${only("fit verdict")} · level from brand only or none: ${only("level")} · some trait thin: ${only("thin")}`);
process.exit(0);
