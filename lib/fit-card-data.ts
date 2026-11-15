// The fit card's per-racket content (lib/fit-card.ts), server side: the page passes one racket's entry to the browser.
import padel from "../db/fit-card/padel.json";
import type { CardContent } from "./fit-card";
import { niche } from "./niche";

const SITES: Record<string, Record<string, CardContent>> = { padel: padel as Record<string, CardContent> };

export function cardContent(slug: string, site = niche.id): CardContent | null {
  return SITES[site]?.[slug] ?? null;
}
