/** "Monarch" / "Monarch", "Mullvad" / "Mullvad VPN": the name is the brand or starts with it, ignoring case and punctuation. */
export function repeatsBrand(name: string, brand: string) {
  const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const n = words(name), b = words(brand);
  return !!b && (n === b || n.startsWith(b + " "));
}
