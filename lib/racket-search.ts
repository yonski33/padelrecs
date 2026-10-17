export type SearchRacket = { name: string; slug: string; shape?: string | null; notes?: number };

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Each word may occur anywhere in the name; words need not be adjacent or ordered.
export function matchingRackets<T extends SearchRacket>(rackets: readonly T[], query: string): T[] {
  const normalized = normalize(query);
  const words = normalized.split(/\s+/).filter(Boolean);
  if (!words.length) return [...rackets];
  return rackets.filter(racket => {
    const name = normalize(racket.name);
    return words.every(word => name.includes(word));
  }).sort((a, b) => {
    const aName = normalize(a.name), bName = normalize(b.name);
    const rank = (name: string) => name === normalized ? 0 : name.startsWith(normalized) ? 1 : 2;
    return rank(aName) - rank(bName) || a.name.localeCompare(b.name);
  });
}
