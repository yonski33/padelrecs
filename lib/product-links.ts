import { niche } from "./niche";

export type WebsiteButton = { url: string; label: string; affiliate: boolean };

/**
 * The "Visit site" button for a product page, on niches with `website` links: the product's affiliate link when it has one,
 * otherwise its official website. Null on other niches and for products with neither. Swapping in an affiliate link is a
 * data change only (db/catalogs/<niche>.json affiliateUrl, then scripts/sync-product-links.ts): the button then carries
 * rel="sponsored" and the page shows the affiliate note, which it never does for a plain website link.
 */
export function websiteButton(product: { websiteUrl: string | null; affiliateUrl: string | null }, settings = niche.website): WebsiteButton | null {
  if (!settings) return null;
  const url = safeUrl(product.affiliateUrl) ?? safeUrl(product.websiteUrl);
  if (!url) return null;
  return { url, label: settings.label ?? "Visit site", affiliate: url === safeUrl(product.affiliateUrl) };
}

/** Only absolute https:// addresses become links, so a bad row can never put a javascript: or relative URL on a page. */
function safeUrl(value: string | null) {
  if (!value) return null;
  try { return new URL(value).protocol === "https:" ? value : null; } catch { return null; }
}
