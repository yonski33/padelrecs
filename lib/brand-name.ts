/** The bold product title: brand + name ("ILNP Nail Polish", "Bullpadel Vertex 05"), without repeating a brand the name
 *  already carries (owner choice, 2026-11-05: the small brand line above a bare model read as duplicates on NailsRecs). */
export function displayName(name: string, brand: string | null | undefined) {
  // Padel (owner 2026-11-17): the year is part of the name, shown as "Bullpadel Vertex 05 (2026)".
  const shown = (TIDY_CASE ? tidyCase(name) : name).replace(YEAR_TAIL, YEAR_PARENS ? " ($1)" : " $1");
  return !brand || repeatsBrand(name, brand) || ownBrand(name) ? shown : `${brand} ${shown}`;
}

/** Sites whose catalog names come in mixed casing from the sources ("Adidas metalbone 3.5", "Coello motion", "AT10 18k"):
 *  shown title-cased with carbon grades in capitals (audit 2026-11-15, #21). Display only; the catalog keeps its names.
 *  Not for sites whose brands are lowercase on purpose (monday.com). NICHE is inlined at build time (next.config.ts). */
const TIDY_CASE = ["padel"].includes(process.env.NICHE ?? "");
const YEAR_PARENS = ["padel"].includes(process.env.NICHE ?? ""), YEAR_TAIL = /\s+\(?((?:19|20)\d\d)\)?$/;
/** Sites whose year in the name is the generation, not a model year ("ASUS ROG Zephyrus G14 2025", LaptopRecs): kept. */
const YEAR_IS_GENERATION = ["laptop"].includes(process.env.NICHE ?? "");
/** A display name without its year, in either form ("… 2026" or "… (2026)"); LaptopRecs keeps it (its generation). */
export const withoutYear = (name: string) => YEAR_IS_GENERATION ? name : name.replace(YEAR_TAIL, "");
export function tidyCase(name: string) {
  return name.split(/(\s+)/).map(w => /^[a-z][a-z]+$/.test(w) ? w[0].toUpperCase() + w.slice(1) : w.replace(/^(\d+)k$/, "$1K")).join("");
}

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * The name already names the brand, so "brand + name" would say it twice:
 * - the name is the brand or starts with it: "Mullvad" / "Mullvad VPN";
 * - its first word is one of the brand's words: "Charles Schwab" / "Schwab One", "Otter.ai" / "Otter", "monday.com" / "monday work management";
 * - its first word is a short form of the brand: "Tempur-Pedic" / "TEMPUR-Adapt", "WinkBeds" / "WinkBed Plus";
 * - its first word is the brand's initials: "Tuft & Needle" / "T&N Mint", "Amazon Web Services" / "AWS Amplify".
 */
export function repeatsBrand(name: string, brand: string) {
  const n = words(name), b = words(brand);
  if (!b) return false;
  if (n === b || n.startsWith(b + " ")) return true;
  const first = n.split(" ")[0], bw = b.split(" ");
  if (first.length >= 3 && bw.includes(first)) return true;
  if (first.length >= 5 && bw[0].startsWith(first)) return true;
  const initials = bw.length > 1 ? bw.map(w => w[0]).join("") : "";
  return !!initials && name.split(/\s+/)[0].toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === initials;
}

/**
 * Products sold under a name of their own, whose brand in the catalog is the parent company: "DigitalOcean Cloudways" or
 * "OpenAI ChatGPT" is not what anyone calls them. Owner choice, 2026-11-05 (HostingRecs Cloudways). The brand still links
 * the product to its parent's brand page; only the bold title drops it. Add new names here when a catalog gains one.
 */
const OWN_BRAND = new Set([
  // HostingRecs
  "Cloudways", "Linode", "Heroku", "WordPress.com", "Kimsufi", "SpinupWP",
  // SoftwareRecs
  "ChatGPT", "Claude", "Claude Code", "Grok", "WooCommerce", "Basecamp", "Things 3",
  // KitchenRecs
  "Magic Bullet",
].map(words));
export function ownBrand(name: string) { return OWN_BRAND.has(words(name)); }

/** A product's name without its brand ("Metalbone CTRL" for "Adidas Metalbone CTRL"), for headings like "Players on the
 *  Metalbone CTRL". Keeps the brand when the rest would read as a bare number or a fragment ("2 Pro" → "Simucube 2 Pro",
 *  owner 2026-11-21): when it starts with a digit or is under 4 characters. */
export function shortModel(name: string, brand: string | null | undefined): string {
  if (!brand || !name.toLowerCase().startsWith(`${brand.toLowerCase()} `)) return name;
  const rest = name.slice(brand.length + 1);
  return /^\d/.test(rest) || rest.length < 4 ? name : rest;
}
