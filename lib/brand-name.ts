/** The bold product title: brand + name ("ILNP Nail Polish", "Bullpadel Vertex 05"), without repeating a brand the name
 *  already starts with (owner choice, 2026-11-05: the small brand line above a bare model read as duplicates on NailsRecs). */
export function displayName(name: string, brand: string | null | undefined) {
  return !brand || repeatsBrand(name, brand) ? name : `${brand} ${name}`;
}

/** "Monarch" / "Monarch", "Mullvad" / "Mullvad VPN": the name is the brand or starts with it, ignoring case and punctuation. */
export function repeatsBrand(name: string, brand: string) {
  const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const n = words(name), b = words(brand);
  return !!b && (n === b || n.startsWith(b + " "));
}
