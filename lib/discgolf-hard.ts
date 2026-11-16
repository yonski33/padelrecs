// DiscGolfRecs' hard rules for the match (Grok match audit 2026-11-16, owner OK via PM 2026-11-17). Server side: they read the
// disc's page (lib/discgolf-skips.ts) and its flight numbers, and go into the match payload (app/match-context.ts), so the
// list honours the page's own advice and the flight numbers' limits. Pure, so tests feed plain discs.
//   beginner    the page says newer players (or slow arms) should skip it, or speed 12+ (a distance driver that needs a big arm)
//   slower arm  the page says slow arms should skip it, or speed 13+, or speed 12+ with turn + fade ≥ 2
//   specialty   turn ≤ −4 (a roller / turnover disc): never #1 for "any stability"
//   no flight   without all four flight numbers a disc isn't ranked until the numbers are fixed
//   advanced    a speed ≤ 7 disc (putters, mids: the pro bag) suits advanced players at least 50, whatever its reviewers' level
import { flightOf } from "./discgolf-profile";
import { pageSkips } from "./discgolf-skips";
import pages from "../db/racket-page/discgolf.json";
import type { FitFacts } from "./fit-verdict";
import type { Level } from "./quick-match";

export type SiteRules = { hard?: FitFacts["hard"]; flags?: { specialty?: true; noFlight?: true }; suitsFloor?: Partial<Record<Level, number>> };
const PAGES = pages as Record<string, { bottom?: string; tagline?: string }>;
/** The page's own sentence that says to skip it, for the fit check's reason. */
const sentence = (slug: string, re: RegExp) => `${PAGES[slug]?.tagline ?? ""} ${PAGES[slug]?.bottom ?? ""}`.split(/(?<=\.)\s+/).find(x => re.test(x))?.trim();

export function discRules(d: { slug: string; weight: string | null }): SiteRules {
  const f = flightOf(d.weight), skip = pageSkips(d.slug), hard: NonNullable<FitFacts["hard"]> = {};
  if (skip.beginner || skip.arm) hard.beginner = sentence(d.slug, /skip it|first disc/i) ?? "Not one for a first bag.";
  else if (f && f.speed >= 12) hard.beginner = `Speed ${f.speed}: it needs a strong arm before it flies as rated. Start with a fairway driver.`;
  if (skip.arm) hard.arm = sentence(d.slug, /slow(er)? arms?[^.]*skip it/i) ?? "Slower arms should skip it.";
  else if (f && (f.speed >= 13 || (f.speed >= 12 && f.turn + f.fade >= 2))) hard.arm = `Speed ${f.speed}${f.speed < 13 ? " with a firm finish" : ""}: it needs more arm speed than a slower arm has.`;
  const flags: SiteRules["flags"] = {};
  if (!f) flags.noFlight = true;
  else if (f.turn <= -4) flags.specialty = true;
  return { ...(Object.keys(hard).length ? { hard } : {}), ...(Object.keys(flags).length ? { flags } : {}), ...(f && f.speed <= 7 ? { suitsFloor: { advanced: 50 } } : {}) };
}


/** The mold a disc is a variant of, for one place per mold in the quiz's results: "Kastaplast Berg X" and "Kastaplast Berg" are
 *  both "kastaplast berg", "Innova Premier DD1" and "Innova DD1" both "innova dd1". Stability versions (SS / OS) count too. */
export const moldOf = (name: string) => name.toLowerCase().split(/\s+/).filter((w, i, all) => !(i > 0 && (w === "premier" || (i === all.length - 1 && i >= 2 && ["x", "ss", "os", "xs"].includes(w))))).join(" ");
