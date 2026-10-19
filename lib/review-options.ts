import { z } from "zod";
import { niche } from "./niche";
import type { ProfileField } from "./niche/types";

// Values the active niche accepts for player-profile fields and web-review sources. Shared by the public form API and admin editing.
const oneOf = (values: string[]) => z.enum(values as [string, ...string[]]);
export const profileValues = (field: ProfileField) => niche.profile[field].options.map(o => o.value);
/** An optional profile answer: one of the niche's values, or "" for "not answered". */
export const profileChoice = (field: ProfileField) => z.union([z.literal(""), oneOf(profileValues(field))]);
export const sourcePlatform = oneOf(niche.sourcePlatforms);

/** Web review text: the source's exact words (excerpt), our own summary, or both. Blank fields become null. */
const optionalText = (min: number, max: number, label: string) => z.string().trim().max(max).optional().transform(v => v || null).refine(v => v === null || v.length >= min, `${label} needs at least ${min} characters`);
// No practical cap on excerpts (as before); summaries stay short.
export const webExcerpt = optionalText(20, 1_000_000, "The excerpt");
export const webSummary = optionalText(30, 1200, "The summary");
/** How the source felt overall; "" means not judged. */
export const sentiments = ["positive", "mixed", "negative"] as const;
export type Sentiment = typeof sentiments[number];
export const webSentiment = z.union([z.literal(""), z.enum(sentiments)]).optional().transform(v => v || null);
export const hasWebText = (v: { excerpt: string | null; summary: string | null }) => !!(v.excerpt || v.summary);
