/*
 * CoffeeRecs' Thread copy (2026-11-28, the v3 port on the PickleballRecs template), the same shape as lib/thread/copy.ts,
 * which picks this file on NICHE=coffee.
 *
 * No Thread guides yet: the five guide slots all point at the live "Coffee gear, decoded" page (/guide, lib/niche/coffee-guide.ts),
 * which keeps its own page (lib/thread/look.ts THREAD_GUIDES_OFF). Coffee guides in the Thread look are a writing job for the
 * in-house writer and checker (owner rule 2026-11-26), not copy made up here. Info pages: padel's live text with the site's
 * words swapped in, as on PickleballRecs and LaptopRecs.
 */
import type { GuideCopy, InfoCopy } from "./copy";

/** One label per slot; every slot is the one /guide page for now. */
export const CF_GUIDE_LINK_LABELS: Record<GuideCopy["key"], string> = {
  racket: "Coffee gear, decoded",
  beginner: "Coffee gear, decoded",
  shape: "Coffee gear, decoded",
  side: "Coffee gear, decoded",
  elbow: "Coffee gear, decoded",
};
export const CF_GUIDES: GuideCopy[] = [];

/** Padel's live words → coffee's, for the info pages. Order matters (the site name and longer phrases first). */
const SWAPS: [RegExp, string][] = [[/PadelRecs/g, "CoffeeRecs"], [/\bpadel rackets\b/g, "coffee gear"], [/\bpadel racket\b/g, "product"], [/\bPadel rackets\b/g, "Coffee gear"],
  [/\bpadel\b/g, "coffee"], [/\bPadel\b/g, "Coffee"], [/\brackets\b/g, "products"], [/\bracket\b/g, "product"], [/\bRackets\b/g, "Products"], [/\bRacket\b/g, "Product"],
  [/\bplayers\b/g, "owners"], [/\bplayer\b/g, "owner"], [/\bPlayers\b/g, "Owners"], [/\bPlayer\b/g, "Owner"], [/\bplayed\b/g, "used"], [/\bplay\b/g, "use"]];
export const toCoffee = (t: string) => SWAPS.reduce((s, [re, to]) => s.replace(re, to), t);
const swapDeep = <T,>(v: T): T => (typeof v === "string" ? toCoffee(v) : Array.isArray(v) ? v.map(swapDeep)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [toCoffee(k), swapDeep(x)])) : v) as T;
export const coffeeInfo = (padel: InfoCopy[]): InfoCopy[] => swapDeep(padel);
