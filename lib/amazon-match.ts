// Checks that an Amazon listing is the product itself, shared by the photo backfill (scripts/fill-amazon-photos.ts) and
// the live lookup on product pages (lib/amazon.ts findAmazonOffer). A listing that fails is never shown or saved.
import { words } from "./amazon";

const ACCESSORY = /\b(compatible|replacements?|liners?|mats?|covers?|lids?|trays?|stones?|bellows?|filters?|caps?|parts?|sealers?|mounts?|holders?|tamping|gaskets?|pads?|attachments?|samples?|sampler|vials?|inspired|charging|baseplate)\b/i;

/** Third-party parts name the product they fit ("Silicone Mat for Profitec Drive"), so a match alone isn't enough. */
export function isAccessory(product: { name: string; brand: string }, title: string) {
  const own = new Set(words(product.name)), word = ACCESSORY.exec(title)?.[0].toLowerCase();
  return Boolean(word && !own.has(word)) || title.toLowerCase().includes(`for ${product.brand.toLowerCase()}`);
}

const VARIANT = /^(ii|iii|iv|2|3|4|5|pro|plus|ultra|max|mini|nano|lite|mg|s2|impress|esp|mark|monochrom)$/;

/** "Focal Clear MG" isn't the Focal Clear, nor "Cadenza II" the Cadenza: the word after the model marks another version. */
export function isOtherVersion(product: { name: string; brand: string }, title: string) {
  const own = new Set(words(product.name)), brand = new Set(words(product.brand)), found = words(title), model = [...own].filter(w => !brand.has(w));
  if (/\b2nd gen/i.test(title) && !/\b2nd gen/i.test(product.name)) return true;
  const last = Math.max(...model.map(w => found.indexOf(w))), next = found[last + 1];
  return last >= 0 && Boolean(next) && VARIANT.test(next) && !own.has(next);
}

/** A listing for a different kind of product that happens to carry the full name: "CeraVe Healing Ointment Lip Balm
 *  twin pack" for CeraVe Healing Ointment (owner, 2026-11-12), or a multi-pack or bundle whose photo shows the set. */
const OTHER_TYPE = /\b(lip|balm|sticks?|wipes?|cleansers?|wash|shampoo|conditioner|serums?|toners?|sunscreens?|deodorant|refills?|trial|bundle|twin|duo|trio|kit|set)\b/i;
const MULTI_PACK = /\b(\d+|two|three|four)[ -]?(pack|pk|count|ct)\b/i;
/** Words for the same kind of product: a cleanser's listing calls it a face wash. */
const SAME_KIND = [["cleanser", "cleansers", "wash"], ["sunscreen", "sunscreens", "spf"]];
export function isOtherType(product: { name: string }, title: string) {
  const own = new Set(words(product.name));
  for (const group of SAME_KIND) if (group.some(w => own.has(w))) group.forEach(w => own.add(w));
  for (const m of title.matchAll(new RegExp(OTHER_TYPE, "gi"))) if (!own.has(m[0].toLowerCase()) && !own.has(m[0].toLowerCase().replace(/s$/, ""))) return true;
  return MULTI_PACK.test(title) && !MULTI_PACK.test(product.name);
}

/** Every check the live lookup and the backfill share, on top of the name match itself. */
export const looksLikeOtherProduct = (product: { name: string; brand: string }, title: string) =>
  isAccessory(product, title) || isOtherVersion(product, title) || isOtherType(product, title);
