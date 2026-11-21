// TennisRecs catalogue notes (Grok audit, owner OK 2026-11-22; db/thread/tennis-notes.json):
// - unknownYear: rackets whose release year no maker or retailer source gives; their year field keeps the old placeholder,
//   so the Released row is hidden and the home's "just in" row skips them.
// - discontinued: older generations whose maker's next generation is in the catalogue ("Discontinued · Used only").
// - style: the Plays like tag where the votes clearly disagree with the engine's axis and the maker's positioning agrees.
import notes from "../../db/thread/tennis-notes.json";

const UNKNOWN_YEAR = new Set<string>(notes.unknownYear);
const DISCONTINUED: Record<string, string> = notes.discontinued;
const STYLE: Record<string, "control" | "balance" | "power"> = Object.fromEntries(Object.entries(notes.style).map(([k, v]) => [k, v === "all-round" ? "balance" : v as "control" | "power"]));

export const tennisYearKnown = (slug: string) => !UNKNOWN_YEAR.has(slug);
/** The newer generation that replaced it, or null. */
export const tennisReplacedBy = (slug: string): string | null => DISCONTINUED[slug] ?? null;
export const tennisStyle = (slug: string) => STYLE[slug] ?? null;

/** TennisRecs' Feel (audit, owner OK 2026-11-22): from the stiffness (62 RA or less Soft, 63 to 67 Medium, 68 and up Crisp),
 *  unless the feel votes clearly disagree (the leader has 5+ and 1.5x the runner-up). Sources: Do It Tennis (flexible under
 *  63, 63-67 mid), Tennis Warehouse (63 and below flexible), HEAD (66-70 rather stiff). */
export function tennisFeel(surface: string | null | undefined, votes: Record<string, number> | null | undefined): "Soft" | "Medium" | "Crisp" | null {
  const o = Object.entries(votes ?? {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const WORD: Record<string, "Soft" | "Medium" | "Crisp"> = { soft: "Soft", medium: "Medium", hard: "Crisp" };
  if (o.length && o[0][1] >= 5 && o[0][1] >= 1.5 * (o[1]?.[1] ?? 0) && WORD[o[0][0]]) return WORD[o[0][0]];
  const ra = Number(surface?.match(/(\d{2})\s*RA/i)?.[1] ?? NaN);
  return !Number.isFinite(ra) ? null : ra <= 62 ? "Soft" : ra >= 68 ? "Crisp" : "Medium";
}
