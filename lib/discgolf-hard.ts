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
import { stabilityOfFlight } from "./niche/discgolf-guide";
import pages from "../db/racket-page/discgolf.json";
import type { FitFacts } from "./fit-verdict";
import type { Level } from "./quick-match";

export type SiteRules = { hard?: FitFacts["hard"]; warn?: FitFacts["warn"]; lean?: FitFacts["lean"]; flags?: { specialty?: true; noFlight?: true; slowArm?: true };
  suitsFloor?: Partial<Record<Level, number>>;
  /** The engine's axis bound for this disc's one stability (lib/engine shapeBounds, keyed by these words). */ axisKey?: string;
  /** Trait dots kept within [min, max] (audit 2026-11-17): Easy to throw by the flight numbers (#4: speed 11+ is never easy to
   *  throw), Accuracy by the page's own Why yes (#3: no "2/5 Accuracy" beside "Tunnel precision"). */ dotBounds?: Record<string, [number, number]>;
  /** "Slow-arm friendly": the guide's rule, speed 7 or less with turn + fade ≤ 2, or an understable 8–9; no slow-arm warning. */ slowArm?: boolean;
  /** Level scores from the flight numbers, for discs with few players (the 71 / 63 / 37 template, audit #7). */ specSuits?: Record<Level, number> };
type PageNo = { title: string; t: string; for?: string[] };
const PAGES = pages as Record<string, { bottom?: string; tagline?: string; no?: PageNo[]; yes?: PageNo[] }>;
/** A Why yes that claims accuracy. */
const ACCURATE = /precis|accura|tunnel|dead.straight|straight lines?|holds? (a |its |straight )?lines?|on line\b/i;
/** The page's own sentence that says to skip it, for the fit check's reason. */
const sentence = (slug: string, re: RegExp) => `${PAGES[slug]?.tagline ?? ""} ${PAGES[slug]?.bottom ?? ""}`.split(/(?<=\.)\s+/).find(x => re.test(x))?.trim();
/** A "why not" item on the page for this pick ("Not a first disc", "Stiff for beginners"), its line without the == marks. */
const noFor = (slug: string, who: string) => PAGES[slug]?.no?.find(x => (x.for?.includes(who) || (who === "beginner" && /beginners?|newer|first disc/i.test(x.title)))
  && NEEDS_ARM.test(`${x.title} ${x.t}`));
/** Only warnings that it needs more arm than a newer or slower thrower has count (not quirks like "No fade to save you"). */
const NEEDS_ARM = /not a first disc|stiff|beefy|brick|too overstable|very overstable|hooks? (early|hard)|dumps?|needs? (more |a big |real )?(arm|power|speed)|power throwers? only/i;
const line = (x: PageNo) => `${x.title}: ${x.t.replace(/==/g, "").replace(/^./, c => c.toLowerCase())}`.replace(/\s+/g, " ");
const AXIS: Record<string, string> = { understable: "dg-under", stable: "dg-stable", overstable: "dg-over" };

export function discRules(d: { slug: string; weight: string | null }): SiteRules {
  const f = flightOf(d.weight), skip = pageSkips(d.slug), st = stabilityOfFlight(f), hard: NonNullable<FitFacts["hard"]> = {}, warn: NonNullable<FitFacts["warn"]> = {};
  const nb = noFor(d.slug, "beginner"), na = noFor(d.slug, "arm");
  // Beginners (audit 2026-11-17 #5–#7, #16–#18): the page says skip it or "not a first disc"; speed 11+; a very overstable
  // finish (fade 3+: the Firebird, the Harp). Speed 9–10 is a step-up driver: shown, but after putters, mids and fairways.
  if (skip.beginner || skip.arm) hard.beginner = sentence(d.slug, /skip it|first disc/i) ?? "Not one for a first bag.";
  else if (nb && /not a first disc/i.test(nb.title)) hard.beginner = line(nb);
  else if (f && f.speed >= 11) hard.beginner = `Speed ${f.speed}: it needs a strong arm before it flies as rated. Start with a fairway driver.`;
  else if (f && f.fade >= 3) hard.beginner = `Fade ${f.fade}: a hard, early finish for wind and utility shots; a newer arm gets little distance from it.`;
  else if (f && f.speed >= 9) warn.beginner = `Speed ${f.speed}: a step-up driver, once you can throw a fairway driver about 250 ft.`;
  else if (nb) warn.beginner = line(nb);
  // Slower arms: the page says skip it, or speed 11+ (the guide: "11–14 · 325 ft +"); a page warning for arms is a soft no.
  if (skip.arm) hard.arm = sentence(d.slug, /slow(er)? arms?[^.]*skip it/i) ?? "Slower arms should skip it.";
  else if (f && f.speed >= 11) hard.arm = `Speed ${f.speed}: it needs a 325 ft arm or more; a slower arm gets an early fade.`;
  else if (na) warn.arm = line(na);
  else if (f && f.speed >= 9 && st !== "understable") warn.arm = `Speed ${f.speed}: it needs a smooth throw of about 250 to 325 ft to fly as rated.`;
  const flags: SiteRules["flags"] = {};
  if (!f) flags.noFlight = true;
  else if (f.turn <= -4) flags.specialty = true;
  const slowArm = !!f && !skip.arm && !na && ((f.speed <= 7 && f.turn + f.fade <= 2) || (f.speed <= 9 && st === "understable"));
  const armDots: [number, number] | undefined = !f ? undefined : f.speed >= 11 || (f.speed >= 9 && st === "overstable") ? [1, 2]
    : f.fade >= 3 ? [1, 3] : slowArm || f.speed <= 5 ? [4, 5] : undefined;
  const specSuits = f ? { beginner: hard.beginner ? 20 : f.speed >= 9 ? 45 : f.speed <= 5 ? 80 : 70,
    intermediate: f.speed >= 13 ? 55 : 75, advanced: f.speed >= 9 ? 80 : f.speed <= 7 ? 60 : 70 } : undefined;
  if (slowArm) flags.slowArm = true;
  const dotBounds: Record<string, [number, number]> = {};
  if (armDots) dotBounds.arm = armDots;
  if (PAGES[d.slug]?.yes?.some(x => ACCURATE.test(`${x.title} ${x.t}`))) dotBounds.accuracy = [4, 5];
  return { ...(Object.keys(hard).length ? { hard } : {}), ...(Object.keys(warn).length ? { warn } : {}), ...(Object.keys(flags).length ? { flags } : {}),
    ...(st ? { lean: st === "understable" ? "control" as const : st === "overstable" ? "power" as const : "balance" as const, axisKey: AXIS[st] } : {}),
    ...(Object.keys(dotBounds).length ? { dotBounds } : {}), slowArm, ...(specSuits ? { specSuits } : {}), ...(f && f.speed <= 7 ? { suitsFloor: { advanced: 50 } } : {}) };
}

/** The mold a disc is a variant of, for one place per mold in the quiz's results: "Kastaplast Berg X" and "Kastaplast Berg" are
 *  both "kastaplast berg", "Innova Premier DD1" and "Innova DD1" both "innova dd1". Stability versions (SS / OS) count too. */
export const moldOf = (name: string) => name.toLowerCase().split(/\s+/).filter((w, i, all) => !(i > 0 && (w === "premier" || (i === all.length - 1 && i >= 2 && ["x", "ss", "os", "xs"].includes(w))))).join(" ");
