import { sql } from "drizzle-orm";
import { database } from "./data";
import { niche } from "../lib/niche";
import { assertSchemaName } from "./migrations";
import { MAX_TRAIT_TEXT_HINT, type Trait } from "../lib/trait-score";
import { traitDefsFor } from "../lib/fit-config";

/** This site's trait keys (lib/fit-config.ts). */
const TRAITS = traitDefsFor(niche).map(t => t.key);

/** "How it plays" set by hand in the admin area (owner 2026-11-15), stored per racket in rackets.trait_override (jsonb,
 *  migration 0022): dots 1–5 and/or a line of text per trait, plus a short record of who changed what and when. Read with raw
 *  SQL like the quick-take block: empty when the column is missing (a niche not migrated yet). */
export type TraitEdit = { dots?: number; text?: string };
export type TraitLogEntry = { at: string; by: string; trait: Trait; field: "dots" | "text"; from: string | null; to: string | null };
/** Expert values (owner 2026-11-15, ENGINE-PLAN section D "Expert editing in admin"): 0–100 per attribute (the traits and
 *  the level suits scores), each with a required short note; they win on the site, the calculated value stays visible. */
export const EXPERT_KEYS = [...TRAITS, "suits_beginner", "suits_intermediate", "suits_advanced"] as const;
export type ExpertKey = typeof EXPERT_KEYS[number];
export type ExpertValue = { value: number; note: string; by: string; at: string };
export type ExpertLogEntry = { at: string; by: string; key: ExpertKey; from: number | null; to: number | null; note: string };
export type TraitOverride = { traits: Partial<Record<Trait, TraitEdit>>; log: TraitLogEntry[]; expert?: Partial<Record<ExpertKey, ExpertValue>>; expertLog?: ExpertLogEntry[] };
export const MAX_EXPERT_NOTE = 600;
export const MAX_TRAIT_TEXT = MAX_TRAIT_TEXT_HINT, MAX_TRAIT_LOG = 50;

export async function traitOverrides(): Promise<Map<string, TraitOverride>> {
  try {
    const db = await database();
    const rows = await db.execute(sql`select id, trait_override from ${sql.identifier(assertSchemaName(niche.schema))}.rackets where trait_override is not null`);
    const list = (rows as unknown as { rows?: Row[] }).rows ?? (rows as unknown as Row[]);
    return new Map(list.map(r => [r.id, readTraitOverride(r.trait_override)]));
  } catch { return new Map(); }
}
type Row = { id: string; trait_override: unknown };

/** Only known traits, whole dots 1–5 and short text survive; the log keeps its last MAX_TRAIT_LOG entries. */
export function readTraitOverride(v: unknown): TraitOverride {
  const o = v && typeof v === "object" ? v as { traits?: Record<string, unknown>; log?: unknown } : {};
  const traits: Partial<Record<Trait, TraitEdit>> = {};
  for (const t of TRAITS) {
    const e = o.traits?.[t] as { dots?: unknown; text?: unknown } | undefined;
    if (!e || typeof e !== "object") continue;
    const dots = Number.isInteger(e.dots) && (e.dots as number) >= 1 && (e.dots as number) <= 5 ? e.dots as number : undefined;
    const text = typeof e.text === "string" && e.text.trim() ? e.text.trim().slice(0, MAX_TRAIT_TEXT) : undefined;
    if (dots || text) traits[t] = { ...(dots ? { dots } : {}), ...(text ? { text } : {}) };
  }
  const log = Array.isArray(o.log) ? (o.log as TraitLogEntry[]).filter(x => x && typeof x.at === "string" && TRAITS.includes(x.trait)).slice(-MAX_TRAIT_LOG) : [];
  const ox = (o as { expert?: Record<string, unknown> }).expert, expert: Partial<Record<ExpertKey, ExpertValue>> = {};
  for (const k of EXPERT_KEYS) {
    const e = ox?.[k] as Partial<ExpertValue> | undefined;
    if (e && typeof e.value === "number" && e.value >= 0 && e.value <= 100 && typeof e.note === "string" && e.note.trim())
      expert[k] = { value: Math.round(e.value), note: e.note.trim().slice(0, MAX_EXPERT_NOTE), by: String(e.by ?? ""), at: String(e.at ?? "") };
  }
  const xl = (o as { expertLog?: unknown }).expertLog;
  const expertLog = Array.isArray(xl) ? (xl as ExpertLogEntry[]).filter(x => x && typeof x.at === "string" && (EXPERT_KEYS as readonly string[]).includes(x.key)).slice(-MAX_TRAIT_LOG) : [];
  return { traits, log, ...(Object.keys(expert).length ? { expert } : {}), ...(expertLog.length ? { expertLog } : {}) };
}

/** An expert value as typed: 0–100, or 1–10 (×10): anything up to 10 is read as the 1–10 scale. Null for blank or out of range. */
export function readExpertValue(raw: string | undefined | null): number | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n <= 10 ? n * 10 : n);
}

/** Expert edits applied: a value needs a note; blank removes it. Every change is logged with its note. */
export function editExpert(prev: TraitOverride, next: Partial<Record<ExpertKey, { value: number | null; note: string }>>, by: string, at: string): TraitOverride {
  const expert = { ...prev.expert }, log = [...(prev.expertLog ?? [])];
  for (const k of EXPERT_KEYS) {
    if (!(k in next)) continue;
    const want = next[k]!, had = expert[k];
    const note = want.note.trim().slice(0, MAX_EXPERT_NOTE);
    if (want.value === null) { if (had) { delete expert[k]; log.push({ at, by, key: k, from: had.value, to: null, note: note || "removed" }); } continue; }
    if (!note) continue;
    if (had?.value === want.value && had.note === note) continue;
    expert[k] = { value: want.value, note, by, at };
    log.push({ at, by, key: k, from: had?.value ?? null, to: want.value, note });
  }
  return { ...prev, expert, expertLog: log.slice(-MAX_TRAIT_LOG) };
}

/** The new override after an admin save: what changed goes into the log as `by` at `at`. */
export function editTraitOverride(prev: TraitOverride, next: Partial<Record<Trait, TraitEdit>>, by: string, at: string): TraitOverride {
  const log = [...prev.log];
  for (const t of TRAITS) {
    const a = prev.traits[t] ?? {}, b = next[t] ?? {};
    if ((a.dots ?? null) !== (b.dots ?? null)) log.push({ at, by, trait: t, field: "dots", from: a.dots ? String(a.dots) : null, to: b.dots ? String(b.dots) : null });
    if ((a.text ?? null) !== (b.text ?? null)) log.push({ at, by, trait: t, field: "text", from: a.text ?? null, to: b.text ?? null });
  }
  // Expert values ride along untouched.
  return { ...prev, traits: Object.fromEntries(Object.entries(next).filter(([, e]) => e && (e.dots || e.text))), log: log.slice(-MAX_TRAIT_LOG) };
}

/** An expert's level word (or range) as suits scores: "intermediate" → beginner 45 · intermediate 85 · advanced 45, the level
 *  next to the band at `adjacent` (a site's fit.expertAdjacentSuits; PickleballRecs 55, so it passes a gate of 50). */
export function levelToSuits(raw: string | undefined | null, adjacent = 45): Partial<Record<"suits_beginner" | "suits_intermediate" | "suits_advanced", number>> | null {
  const L = ["beginner", "intermediate", "advanced"];
  const parts = String(raw ?? "").trim().toLowerCase().split(/\s*(?:-|–|→|to)\s*/).map(x => x.replace(/s$/, "")).map(x => /^(pro|professional|elite)$/.test(x) ? 2 : L.indexOf(x)); // "pro" counts as advanced
  if (!parts.length || parts.some(i => i < 0)) return null;
  const from = Math.min(...parts), to = Math.max(...parts);
  const v = (i: number) => i >= from && i <= to ? 85 : Math.abs(i < from ? from - i : i - to) === 1 ? adjacent : 20;
  return { suits_beginner: v(0), suits_intermediate: v(1), suits_advanced: v(2) };
}
