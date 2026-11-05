/** The bold product title: brand + name ("ILNP Nail Polish", "Bullpadel Vertex 05"), without repeating a brand the name
 *  already carries (owner choice, 2026-11-05: the small brand line above a bare model read as duplicates on NailsRecs). */
export function displayName(name: string, brand: string | null | undefined) {
  return !brand || repeatsBrand(name, brand) || ownBrand(name) ? name : `${brand} ${name}`;
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
