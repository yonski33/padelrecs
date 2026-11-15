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
export type TraitOverride = { traits: Partial<Record<Trait, TraitEdit>>; log: TraitLogEntry[] };
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
  return { traits, log };
}

/** The new override after an admin save: what changed goes into the log as `by` at `at`. */
export function editTraitOverride(prev: TraitOverride, next: Partial<Record<Trait, TraitEdit>>, by: string, at: string): TraitOverride {
  const log = [...prev.log];
  for (const t of TRAITS) {
    const a = prev.traits[t] ?? {}, b = next[t] ?? {};
    if ((a.dots ?? null) !== (b.dots ?? null)) log.push({ at, by, trait: t, field: "dots", from: a.dots ? String(a.dots) : null, to: b.dots ? String(b.dots) : null });
    if ((a.text ?? null) !== (b.text ?? null)) log.push({ at, by, trait: t, field: "text", from: a.text ?? null, to: b.text ?? null });
  }
  return { traits: Object.fromEntries(Object.entries(next).filter(([, e]) => e && (e.dots || e.text))), log: log.slice(-MAX_TRAIT_LOG) };
}
