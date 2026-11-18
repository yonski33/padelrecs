// A review byline's profile words, the same on every page (Grok audit 2026-11-18: "both side", "played tried briefly").
import { niche } from "./niche";

type Opt = { value: string; display?: string };
const opts = (k: "playingSide" | "timeWithRacket") => ((niche.profile as Record<string, { options?: Opt[] } | undefined>)[k]?.options ?? []);

/** The writer's side or format: the site's own words ("mostly doubles"), else "left side" / "both sides". */
export function sideWord(v?: string | null): string | null {
  if (!v) return null;
  const d = opts("playingSide").find(o => o.value === v)?.display;
  if (d) return d;
  return /^both$/i.test(v) ? "both sides" : `${v.toLowerCase()} side`;
}
/** How long they have used it: "played 1–6 months", but "tried briefly" on its own (no "played tried briefly"). */
export function playedWord(v: string | null | undefined, verb = "played"): string | null {
  if (!v) return null;
  const d = opts("timeWithRacket").find(o => o.value === v)?.display ?? v.toLowerCase();
  return /^tried\b/.test(d) ? d : `${verb} ${d}`;
}
