// Read-time clean-up of creator text and shop rows (PickleballRecs Grok audit 2026-11-24). The stored rows keep what the
// sweep saved; the page shows the catalogue's spelling, no quoted prices and only US shops priced in dollars. Pure, so the
// tests check it without a database. Shared by every creator-page site.
import { PRICE_TEXT } from "./creators";

/** Product names creators (and auto-captions) misspell, as the catalogue spells them. Whole words only. */
const SPELLING: [RegExp, string][] = [
  [/\bBoomstick(s?)\b/g, "Boomstik$1"],
  [/\bboomstick(s?)\b/g, "boomstik$1"],
];
export const catalogSpelling = (t: string) => SPELLING.reduce((s, [re, to]) => s.replace(re, to), t);

/** A price phrase inside a sentence, with the words that lead into it: "for over $100 less", ", and about $83 cheaper",
 *  "at $25 less", "near $100". */
const PRICE_PHRASE = /,?\s*(?:and\s+)?(?:(?:for|at|near|around|about|roughly|over|under|only|just)\s+)*[€$£]\s?\d[\d.,]*(?:\s*(?:less|more|cheaper|dearer|off|extra))?/gi;
/** Text without quoted prices (owner 2026-11-24: prices go stale; live prices live in the price box only). A price phrase is
 *  cut out of its sentence; a clause still naming a price after that ("Spitfire is better value at the price…") is dropped;
 *  null when nothing is left. Text without a price comes back unchanged. */
export function withoutPrices(t: string | null): string | null {
  if (!t || !PRICE_TEXT.test(t)) return t;
  let out = t.replace(PRICE_PHRASE, "").replace(/\s+([,.;])/g, "$1").replace(/\s{2,}/g, " ").trim();
  if (PRICE_TEXT.test(out)) out = out.split(/(?<=[.;!?])\s+|;\s*/).filter(c => !PRICE_TEXT.test(c)).join(" ").trim();
  out = out.replace(/[;,]\s*$/, "").trim();
  if (!out) return null;
  return /[.!?]$/.test(out) || !/[.!?]$/.test(t) ? out : `${out}.`;
}
/** Both clean-ups, for any creator text the page shows. */
export const cleanCreatorText = (t: string | null) => { const s = withoutPrices(t); return s == null ? null : catalogSpelling(s); };

/** Shops saved under their bare web address, by the name on their own site. */
const SHOP_NAMES: Record<string, string> = {
  "hometownpickleball.com": "Hometown Pickleball", "pickleballdropshop.com": "Pickleball Drop Shop", "paddlepro.com": "PaddlePro",
  "tuckerpickleball.com": "Tucker Pickleball", "hvpickleball.com": "HV Pickleball", "discountgolfworld.com": "Discount Golf World",
  "therktman.com": "The RKT Man", "racquetstore.com": "Racquetstore", "hockeymonkey.com": "HockeyMonkey", "lovepickle.store": "Love Pickle",
  "elevatepkl.com": "Elevate Pickleball",
};
export const shopName = (name: string) => SHOP_NAMES[name.trim().toLowerCase()] ?? name;

/** Price rows the page leaves out: shops outside the US (their prices are not dollars: Ireland, Singapore, Canada), a review
 *  site saved as a shop, and links checked dead (404, 2026-11-24). */
const NOT_US_SHOP = /^https?:\/\/(?:www\.)?(?:[^/]+\.(?:ie|uk|ca|au|sg|eu|de|fr|es|it|nl)|pickleupsg\.com|sportsvirtuoso\.com)\//i;
const NOT_A_SHOP = /^https?:\/\/(?:www\.)?pickleheads\.com\//i;
const DEAD_LINKS = new Set([
  "https://www.pickleballgalaxy.com/six-zero-coral-pro-elongated-pickleball-paddle.html",
  "https://www.pickleballgalaxy.com/six-zero-coral-hybrid-pickleball-paddle.html",
]);
export const shownShop = (url: string) => !NOT_US_SHOP.test(url) && !NOT_A_SHOP.test(url) && !DEAD_LINKS.has(url);
