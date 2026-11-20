// The "How does it play?" prefill for one racket (db/thread/padel-traits.json, built by scripts/thread-trait-prefill.mts
// from what reviews already say), and db/thread/pickleball-traits.json the same way. Null elsewhere or for a product the
// file doesn't know.
import prefill from "../../db/thread/padel-traits.json";
import pickleball from "../../db/thread/pickleball-traits.json";
import skin from "../../db/thread/skin-traits.json";
import discgolf from "../../db/thread/discgolf-traits.json";
import type { Prefill } from "./trait-prefill";

export type TraitSeed = { sources: number; groups: Record<string, Record<string, number>>; spec: Record<string, string> };
const FILES: Record<string, Prefill> = { padel: prefill as Prefill, pickleball: pickleball as Prefill, skin: skin as Prefill, discgolf: discgolf as Prefill };
export function traitSeed(nicheId: string, racketId: string): TraitSeed | null {
  const r = FILES[nicheId]?.rackets[racketId];
  return r ? { sources: r.sources, groups: r.groups, spec: r.spec } : null;
}
