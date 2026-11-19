// The words on the Thread share cards (app/thread/share/cards.tsx), pure for tests.
import { GUIDES } from "./copy";

/** One line cut at a word to `max` characters with "…" (no trailing punctuation before it); a short line stays as it is. */
export function fitLine(text: string, max = 90): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1), at = cut.lastIndexOf(" ");
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:.–-]+$/, "")}…`;
}
/** The live badge colours (app/thread/ui.tsx tone): green 85+, yellow 70 to 84, white under 70. */
export const toneOf = (n: number) => n >= 85 ? "g" as const : n >= 70 ? "y" as const : "w" as const;

/** The niche's words for the cards: "padel racket" / "pickleball paddle", the people, the site. */
export type ShareWords = { noun: string; nouns: string; people: string; site: string };
export const PADEL_WORDS: ShareWords = { noun: "padel racket", nouns: "padel rackets", people: "player", site: "PadelRecs" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** The plain titled card's pages (catalogue, rankings hub, brands, guides and help), by the key in /share-image?page=. Only
 *  these keys draw a title, so the address can't be used to print any text. */
const pages = (w: ShareWords): Record<string, [string, string]> => ({
  catalog: [`Every ${w.noun}, rated by ${w.people}s`, "Filter by level, style and shape"],
  rankings: [`${cap(w.noun)} rankings`, `Ranked by real ${w.people} reviews`],
  brands: [`${cap(w.noun)} brands`, `Every brand, rated by ${w.people}s`],
  about: [`About ${w.site}`, `Real ${w.people} reviews of ${w.nouns}`],
  score: [`How the ${w.people} score works`, `From real ${w.people} reviews, in plain words`],
  affiliate: ["Affiliate disclosure", "What links pay for, and what they never change"],
  contact: [`Contact ${w.site}`, `Questions, corrections or a missing ${w.noun.split(" ").pop()}`],
});
export function pageTitle(key: string | null, brands: Record<string, string> = {}, w: ShareWords = PADEL_WORDS): { title: string; line: string } | null {
  if (!key) return null;
  const fixed = pages(w)[key];
  if (fixed) return { title: fixed[0], line: fixed[1] };
  const guide = /^guide:([a-z-]+)$/.exec(key)?.[1], g = guide ? GUIDES.find(x => x.key === guide) : null;
  if (g) return { title: g.title, line: `A ${w.site} guide, from real ${w.people} reviews` };
  const brand = /^brand:([a-z0-9-]+)$/.exec(key)?.[1];
  if (brand && brands[brand]) return { title: `${brands[brand]} ${w.nouns}`, line: `Rated by real ${w.people}s` };
  return null;
}
