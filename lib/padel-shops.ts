// PadelRecs shops for the "Where to buy" box on racket pages (db/shop/padel-offers.json, lib/padel-offers.ts).
// Amazon barely sells padel rackets, so these are the padel shops' own product pages. The affiliate programmes
// (Padel-Point on Awin, Padel Market, Padel Nuestro, NINEPADEL, Padel USA) are still pending, so every link is plain
// for now. THIS FILE IS THE ONE PLACE to switch a shop's affiliate link on once it is approved: fill its `affiliate`
// below and its links get the parameters (or the Awin deep link) and rel="sponsored" on the next deploy.

export type ShopCurrency = "EUR" | "GBP" | "USD";

/** How a shop's affiliate link is made, once approved. */
export type Affiliate =
  /** Query parameters added to the shop's own URL, e.g. NINEPADEL's feed template "?ref={YOUR_CODE}". */
  | { kind: "query"; params: Record<string, string> }
  /** An Awin deep link (Padel-Point): https://www.awin1.com/cread.php?awinmid=<merchant>&awinaffid=<publisher>&ued=<url>. */
  | { kind: "awin"; merchant: string; publisher: string };

export type Shop = {
  /** The name used in the data file (Grok pack and the feed scripts). */ name: string;
  /** Short name in the price box (owner 2026-11-23: "show few stores", short names). */ short: string;
  /** The shop's own sites (Padel-Point: the .com store, and .de where only the German store lists the racket). */ hosts: string[]; currency: ShopCurrency;
  /** null = plain link (no affiliate approval yet). */ affiliate: Affiliate | null;
};

export const PADEL_SHOPS: Shop[] = [
  { name: "Padel Nuestro", short: "Padel Nuestro", hosts: ["padelnuestro.com"], currency: "EUR", affiliate: null },
  { name: "Padel-Point", short: "Padel-Point", hosts: ["padel-point.com", "padel-point.de"], currency: "EUR", affiliate: null },
  { name: "Padel Market EU", short: "Padel Market EU", hosts: ["padelmarket.com"], currency: "EUR", affiliate: null },
  { name: "Padel Market US", short: "Padel Market US", hosts: ["us.padelmarket.com"], currency: "USD", affiliate: null },
  // NINEPADEL's public feed (scripts/ninepadel-feed.mts) gives the template "?ref={YOUR_CODE}": once approved, set
  // { kind: "query", params: { ref: "<code>" } }.
  { name: "NINEPADEL", short: "NINEPADEL", hosts: ["ninepadel.com"], currency: "GBP", affiliate: null },
  { name: "Padel USA", short: "Padel USA", hosts: ["padelusa.com"], currency: "USD", affiliate: null },
  { name: "Padel Pro Shop", short: "Padel Pro Shop", hosts: ["padelproshop.com"], currency: "EUR", affiliate: null },
  { name: "Tienda Padel Point", short: "Padel Point ES", hosts: ["tiendapadelpoint.com"], currency: "EUR", affiliate: null },
  { name: "Padelshop", short: "Padelshop", hosts: ["padelshop.com"], currency: "EUR", affiliate: null },
];

const BY_NAME = new Map(PADEL_SHOPS.map(s => [s.name, s]));
export const shopNamed = (name: string) => BY_NAME.get(name) ?? null;

/** The shop's link: its own product URL, or the affiliate link once `affiliate` is set. */
export function shopHref(shop: Shop | null, url: string): string {
  const a = shop?.affiliate;
  if (!a) return url;
  if (a.kind === "awin") return `https://www.awin1.com/cread.php?awinmid=${encodeURIComponent(a.merchant)}&awinaffid=${encodeURIComponent(a.publisher)}&ued=${encodeURIComponent(url)}`;
  const u = new URL(url);
  for (const [k, v] of Object.entries(a.params)) u.searchParams.set(k, v);
  return u.toString();
}

/** "€139.95", "£220", "$209": the shop's own price in its own currency (no conversion is shown). */
export function money(price: number, currency: ShopCurrency): string {
  const sign = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sign}${Number.isInteger(price) ? price : price.toFixed(2)}`;
}

/** Rough rates, for ORDERING the list only (cheapest first across currencies); never shown on the page. */
export const ORDER_RATE_TO_EUR: Record<ShopCurrency, number> = { EUR: 1, GBP: 1.17, USD: 0.92 };
