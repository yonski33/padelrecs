import { z } from "zod";

// The fixed bank of quick tags. Reviews can only carry terms from this list, so counts stay comparable.
// Add new terms at the end; renaming or removing one orphans it on existing reviews.
export const TAGS = [
  { label: "easy power", tone: "pos" },
  { label: "great on smashes", tone: "pos" },
  { label: "good control", tone: "pos" },
  { label: "forgiving", tone: "pos" },
  { label: "arm-friendly", tone: "pos" },
  { label: "fast at the net", tone: "pos" },
  { label: "good spin", tone: "pos" },
  { label: "great in defence", tone: "pos" },
  { label: "head-heavy", tone: "neg" },
  { label: "small sweet spot", tone: "neg" },
  { label: "tiring in long matches", tone: "neg" },
  { label: "vibrates on mishits", tone: "neg" },
  { label: "demanding", tone: "neg" },
  { label: "durability issues", tone: "neg" },
  { label: "firm", tone: "neutral" },
  { label: "soft", tone: "neutral" },
] as const;

export type TagLabel = (typeof TAGS)[number]["label"];
export type TagTone = (typeof TAGS)[number]["tone"];
export const MAX_TAGS = 3;
const labels = TAGS.map(t => t.label) as [TagLabel, ...TagLabel[]];

export function tagTone(label: string): TagTone {
  return TAGS.find(t => t.label === label)?.tone ?? "neutral";
}

/** Accepts a single value, a list, or nothing (forms send any of these); keeps unique bank terms, at most three. */
export const tagsInput = z.preprocess(
  value => value === undefined || value === null || value === "" ? [] : Array.isArray(value) ? value : [value],
  z.array(z.enum(labels)).transform(list => [...new Set(list)]).refine(list => list.length <= MAX_TAGS, `Pick up to ${MAX_TAGS} tags`),
);
