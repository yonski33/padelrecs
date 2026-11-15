import { sql } from "drizzle-orm";
import { database } from "../../../../db/data";
import { niche } from "../../../../lib/niche";
import { assertSchemaName } from "../../../../db/migrations";
import { readTraitOverride, editExpert, readExpertValue, levelToSuits, EXPERT_KEYS, type ExpertKey } from "../../../../db/trait-override";
import { traitDefsFor } from "../../../../lib/fit-config";
import { getCurrentUser } from "../../../../lib/supabase/auth";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../funtimes/auth";
const TRAITS = traitDefsFor(niche).map(t => t.key);

// The admin expert grid (app/funtimes/expert-grid.tsx): saves one racket's expert values, or imports a filled-in expert sheet
// (scripts/expert-gaps.mts) for many. Stored in rackets.trait_override (jsonb, migration 0022) beside the hand-set dots, with a
// change log. Same-origin admin forms only.
type Next = Partial<Record<ExpertKey, { value: number | null; note: string }>>;

/** A small CSV reader (quoted fields with commas and doubled quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) { const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (c !== "\r") cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

async function save(id: string, next: Next, by: string, at: string) {
  const db = await database(), table = sql`${sql.identifier(assertSchemaName(niche.schema))}.rackets`;
  const rows = await db.execute(sql`select trait_override from ${table} where id = ${id}`);
  const list = (rows as unknown as { rows?: { trait_override: unknown }[] }).rows ?? (rows as unknown as { trait_override: unknown }[]);
  if (!list.length) return 0;
  const cur = readTraitOverride(list[0].trait_override), out = editExpert(cur, next, by, at);
  const changed = (out.expertLog?.length ?? 0) - (cur.expertLog?.length ?? 0);
  if (changed) await db.execute(sql`update ${table} set trait_override = ${JSON.stringify(out)}::jsonb where id = ${id}`);
  return changed;
}

export async function POST(request: Request) {
  const forbidden = await adminWriteGuard(request); if (forbidden) return forbidden;
  let raw; try { raw = await readAdminForm(request); } catch { return adminRedirect(request, "tab=expert&result=expert-failed"); }
  const user = await getCurrentUser(), by = user?.email ?? user?.id ?? "admin", at = new Date().toISOString();
  try {
    if (raw.action === "import") {
      const [head, ...lines] = parseCsv(String(raw.csv ?? ""));
      if (!head) return adminRedirect(request, "tab=expert&result=expert-imported:0");
      const col = (n: string) => head.map(h => h.trim().toLowerCase()).indexOf(n);
      const db = await database();
      const res = await db.execute(sql`select id, slug from ${sql.identifier(assertSchemaName(niche.schema))}.rackets`);
      const bySlug = new Map(((res as unknown as { rows?: { id: string; slug: string }[] }).rows ?? (res as unknown as { id: string; slug: string }[])).map(r => [r.slug, r.id]));
      let n = 0;
      for (const l of lines) {
        const id = bySlug.get((l[col("slug")] ?? "").trim()); if (!id) continue;
        const note = ((col("notes") >= 0 ? l[col("notes")] : "") || String(raw.note ?? "") || "expert sheet").trim();
        const next: Next = {};
        for (const t of TRAITS) { const v = readExpertValue(l[col(`expert_${t}`)]); if (v !== null) next[t] = { value: v, note }; }
        const suits = levelToSuits(l[col("expert_level")]);
        if (suits) for (const [k, v] of Object.entries(suits)) next[k as ExpertKey] = { value: v, note };
        if (Object.keys(next).length) n += await save(id, next, by, at);
      }
      return adminRedirect(request, `tab=expert&result=expert-imported:${n}`);
    }
    const id = String(raw.id ?? "").slice(0, 100);
    const next: Next = {};
    for (const k of EXPERT_KEYS) {
      if (!(`expert_${k}` in raw)) continue;
      const v = readExpertValue(raw[`expert_${k}`]), note = String(raw[`note_${k}`] ?? "");
      next[k] = { value: v, note };
    }
    await save(id, next, by, at);
    return adminRedirect(request, `tab=expert&racket=${encodeURIComponent(id)}&result=expert-saved`);
  } catch { return adminRedirect(request, "tab=expert&result=expert-failed"); }
}
