// The fit card's per-racket content (lib/fit-card.ts), server side: the page passes one racket's entry to the browser.
import padel from "../db/fit-card/padel.json";
import pickleball from "../db/fit-card/pickleball.json";
import discgolf from "../db/fit-card/discgolf.json";
import tennis from "../db/fit-card/tennis.json";
import type { CardContent } from "./fit-card";
import { niche } from "./niche";

const SITES: Record<string, Record<string, CardContent>> = { padel: padel as Record<string, CardContent>, pickleball: pickleball as Record<string, CardContent>,
  discgolf: discgolf as Record<string, CardContent>,
  tennis: tennis as Record<string, CardContent> };

export function cardContent(slug: string, site = niche.id): CardContent | null {
  return SITES[site]?.[slug] ?? null;
}
