// "Not tournament-approved" (PickleballRecs, 2026-11-18): paddles missing from the USA Pickleball approved list, as a small
// note on the product page (db/approval/<niche>.json). Fine for rec play; not for sanctioned events.
import pickleball from "../db/approval/pickleball.json";

type Entry = { pulled?: string };
const SITES: Record<string, Record<string, Entry>> = { pickleball: (pickleball as { products: Record<string, Entry> }).products };

/** The note for a product page, or null when the product is approved (or the site has no list). */
export function approvalNote(site: string, slug: string): string | null {
  const e = SITES[site]?.[slug];
  if (!e) return null;
  return e.pulled ? `Not tournament-approved: USA Pickleball removed it from the approved list in ${e.pulled}. Fine for rec play.`
    : "Not tournament-approved: it isn't on the USA Pickleball approved list. Fine for rec play.";
}
