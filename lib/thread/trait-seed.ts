// The "How does it play?" prefill for one racket (db/thread/padel-traits.json, built by scripts/thread-trait-prefill.mts
// from what reviews already say). Padel only; null elsewhere or for a racket the file doesn't know.
import prefill from "../../db/thread/padel-traits.json";
import type { Prefill } from "./trait-prefill";

export type TraitSeed = { sources: number; groups: Record<string, Record<string, number>>; spec: Record<string, string> };
const FILE = prefill as Prefill;
export function traitSeed(nicheId: string, racketId: string): TraitSeed | null {
  const r = nicheId === "padel" ? FILE.rackets[racketId] : undefined;
  return r ? { sources: r.sources, groups: r.groups, spec: r.spec } : null;
}
