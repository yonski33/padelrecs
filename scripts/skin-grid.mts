// The SkinRecs match audit's core grid (skin × goal × sens × acne × type, 553 combos) on a snapshot from
// scripts/skin-snapshot.mts, with the site's own ranking (app/skin/rank.ts). Prints the behaviour metrics the PM asked for
// and the top 5 of three addresses. Read-only.
//   npx tsx --conditions=react-server scripts/skin-grid.mts snap.json [pages.json]
import { readFileSync } from "node:fs";
import { rankSkin, wireCtx, type SkinWire } from "../app/skin/rank";
import { attrProfileFor } from "../lib/attr-profile";
import { readSkinChoice } from "../lib/skin-choice";
import { withSafety } from "../lib/skin-safety";
import { skinPage } from "../lib/skin-page";
import { skin } from "../lib/niche/skin";
import { FEW_VOICES } from "../lib/attr-score";

const snap = JSON.parse(readFileSync(process.argv[2], "utf8")) as (SkinWire & { slug: string })[];
const items: SkinWire[] = snap.map(x => ({ ...x, attrs: withSafety(x.attrs, x.name, x.shape, (skinPage(x.slug)?.no ?? []).map(n => n.title)) }));
const ctx = wireCtx(attrProfileFor(skin)!, items);
const types = skin.typePages ?? [];
const TYPES = [null, "moisturizers", "serums", "cleansers", "sunscreens", "toners", "treatments"];
const combos: Record<string, string>[] = [];
for (const s of [null, "dry", "oily", "combination", "normal"]) for (const g of [null, "hydrate", "calm", "clear"]) for (const sens of [0, 1]) for (const acne of [0, 1]) for (const t of TYPES) {
  if (!s && !g && !sens && !acne) continue;
  const q: Record<string, string> = {}; if (s) q.skin = s; if (g) q.goal = g; if (sens) q.sens = "1"; if (acne) q.acne = "1"; if (t) q.type = t; combos.push(q);
}
const byId = new Map(items.map(x => [x.id, x]));
const scented = (id: string) => ["fragrance", "oils"].includes(String(byId.get(id)!.attrs.facts.fragrance_free));
const strong = (id: string) => byId.get(id)!.attrs.facts.strength === "strong";
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const top1: number[] = []; let rows8 = 0, hi8 = 0, sensBad = 0, sensN = 0, slots5 = 0, thin5 = 0, few = 0;
for (const q of combos) {
  const rows = rankSkin(ctx, readSkinChoice(q, types)), scored = rows.filter(r => r.pct !== null);
  if (scored.length < 5) few++;
  if (scored[0]) top1.push(scored[0].pct!);
  for (const r of scored.slice(0, 8)) { rows8++; if (r.pct! >= 85) hi8++; }
  for (const r of scored.slice(0, 5)) { slots5++; const s = r.m?.parts.find(p => p.key.startsWith("suits_")); if (!s || s.n < FEW_VOICES) thin5++; }
  if (q.sens) { sensN++; if (scored.slice(0, 5).some(r => r.pct! >= 75 && (scented(r.r.id) || strong(r.r.id)))) sensBad++; }
}
const pctOf = (a: number, b: number) => `${(100 * a / b).toFixed(1)}%`;
console.log(JSON.stringify({ combos: combos.length, median_top1: med(top1), top8_ge85: pctOf(hi8, rows8),
  sensitive_scented_or_strong_strong_fit: `${sensBad}/${sensN}`, thin_top5: pctOf(thin5, slots5), combos_lt5_scored: few }, null, 1));
for (const q of [{ skin: "dry" }, { sens: "1" }, { type: "treatments", sens: "1" }] as Record<string, string>[]) {
  const rows = rankSkin(ctx, readSkinChoice(q, types)).slice(0, 5);
  console.log(new URLSearchParams(q).toString(), "→", rows.map(r => `${r.r.name} ${r.pct ?? "—"}`).join(" · "));
}
if (process.argv.includes("--strong")) console.log(items.filter(x => x.attrs.facts.strength === "strong" || x.attrs.facts.acid || x.attrs.facts.neg).map(x => `${x.name} [${x.shape}] ${x.attrs.facts.strength ?? ""} ${x.attrs.facts.acid ? "acid" : ""} ${x.attrs.facts.neg ?? ""}`).join("\n"));
