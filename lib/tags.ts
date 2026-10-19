import { z } from "zod";
import { niche } from "./niche";
import type { Tag } from "./niche/types";

// The niche's fixed bank of quick tags (lib/niche/<niche>.ts). Reviews can only carry terms from this list, so counts stay comparable.
export const TAGS: readonly Tag[] = niche.tags;

export type TagLabel = string;
export type TagTone = Tag["tone"];
export const MAX_TAGS = 3;

export function tagTone(label: string): TagTone {
  return TAGS.find(t => t.label === label)?.tone ?? "neutral";
}

/** Accepts a single value, a list, or nothing (forms send any of these); keeps unique bank terms, at most three. */
export const tagsInput = z.preprocess(
  value => value === undefined || value === null || value === "" ? [] : Array.isArray(value) ? value : [value],
  z.array(z.string().refine(label => TAGS.some(t => t.label === label), "Unknown tag")).transform(list => [...new Set(list)]).refine(list => list.length <= MAX_TAGS, `Pick up to ${MAX_TAGS} tags`),
);
