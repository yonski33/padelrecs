export type SearchRacket = { photo?: string | null; name: string; slug: string; shape?: string | null; brand?: string; notes?: number;
  /** For the Thread look (app/thread/live/header.tsx): the model year, the live Player score (null until it has one), and
   *  whether this year takes its model's row (lib/compare-pairs.ts familyRowIds). Classic ignores them. */
  year?: number; score?: number | null; current?: boolean };
/** Current models first, older years after, each group in match order (the Thread search). */
export const currentFirst = <T extends { current?: boolean }>(list: T[]) => [...list.filter(r => r.current !== false), ...list.filter(r => r.current === false)];

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// One edit (typo) away: "vertx" ~ "vertex", "genuis" ~ "genius".
function within1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// Generous matching, because people never type the exact name. Words may occur anywhere in the name, in any order, and
// ignore added words ("nox at10 18k" finds "Nox AT10 Genius 18K 2026"). "at 10" finds "AT10", "metalbone ctrl" finds
// "Metalbone CTRL 3.5 2026". When nothing matches that way, words one typo away still count ("vertx 05").
export function matchingRackets<T extends { name: string }>(rackets: readonly T[], query: string): T[] {
  const normalized = normalize(query);
  const words = normalized.split(/\s+/).filter(Boolean);
  if (!words.length) return [...rackets];
  const joined = words.join("");
  // The page address counts too: a model can be known by a word its name leaves out ("st5" in siux-electra-pro-st5-2026,
  // listed as "Siux Electra Pro 2026"). Ranking still reads the name.
  const prepared = rackets.map(racket => { const name = normalize(racket.name), slug = "slug" in racket && typeof racket.slug === "string" ? normalize(racket.slug) : "";
    const hay = slug ? `${name} ${slug}` : name;
    return { racket, name, hay, compact: name.replace(/ /g, ""), slugCompact: slug.replace(/ /g, ""), parts: hay.split(" ") }; });
  const strict = prepared.filter(p => words.every(word => p.hay.includes(word)) || p.compact.includes(joined) || (!!p.slugCompact && p.slugCompact.includes(joined)));
  const hits = strict.length ? strict : words.length ? prepared.filter(p => words.every(word => p.hay.includes(word) || (/^[a-z]{4,}$/.test(word) && p.parts.some(part => within1(word, part))))) : [];
  const rank = (p: { name: string; parts: string[] }) => p.name === normalized ? 0 : p.name.startsWith(normalized) ? 1 : words.every(w => p.parts.some(part => part.startsWith(w))) ? 2 : 3;
  const year = (p: { name: string }) => Number(p.name.match(/(?:^| )((?:19|20)\d{2})$/)?.[1] ?? 0);
  return hits.sort((a, b) => rank(a) - rank(b) || year(b) - year(a) || a.racket.name.localeCompare(b.racket.name)).map(p => p.racket);
}
