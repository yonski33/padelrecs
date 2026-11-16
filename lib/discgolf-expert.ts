// The owner's disc golf expert sheet (discgolf_filled_clean.csv, scales agreed 2026-11-16 via the PM) as the shared expert
// store's values (rackets.trait_override expert, db/trait-override.ts), the same store and rules as padel's sheet:
//   stability 1 very understable … 10 very overstable → overstable ("power") s × 10 and understable ("control") (11 − s) × 10;
//   arm speed 1 suits a slow arm … 10 needs a power arm → slower arms ("arm") (11 − a) × 10;
//   glide, grip 1–10 → × 10; level words → the suits scores (levelToSuits). Beat-in has no engine trait: it stays in the
//   disc golf evidence (scripts/discgolf-evidence.mts expert). Accuracy, distance, wind and forehand were left empty.
export type SheetRow = Record<string, string>;
const num = (v: string | undefined) => { const n = Number((v ?? "").trim()); return (v ?? "").trim() && Number.isFinite(n) && n >= 1 && n <= 10 ? n : null; };
/** One sheet row as expert values 0–100 per engine key (suits_* from the level word, by the caller). */
export function expertValues(r: SheetRow): Record<string, number> {
  const o: Record<string, number> = {}, s = num(r.expert_stability), a = num(r.expert_arm_speed), g = num(r.expert_glide), gr = num(r.expert_grip);
  if (s !== null) { o.power = s * 10; o.control = (11 - s) * 10; }
  if (a !== null) o.arm = (11 - a) * 10;
  if (g !== null) o.glide = g * 10;
  if (gr !== null) o.grip = gr * 10;
  return o;
}
/** The sheet in the shared import's format (scripts/import-expert-sheet.mts): slug, expert_<trait> on 1–10, expert_level. */
export function importSheetCsv(rows: SheetRow[]): string {
  const cols = ["slug", "expert_control", "expert_power", "expert_arm", "expert_glide", "expert_grip", "expert_level", "notes"];
  const q = (x: string) => /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x;
  const lines = rows.map(r => { const v = expertValues(r); const d = (k: string) => v[k] === undefined ? "" : String(v[k] / 10);
    return [r.slug, d("control"), d("power"), d("arm"), d("glide"), d("grip"), (r.expert_level ?? "").trim(), ""].map(q).join(","); })
    .filter(l => l.split(",").slice(1).some(x => x));
  return [cols.join(","), ...lines].join("\n") + "\n";
}
