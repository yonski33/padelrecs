// The racket page's fit check as the page's core (owner OK 2026-11-22, "Is this racket right for me?" mock): picks, a fit
// label in words (no match %), up to three lines (good, caution, bad) from the racket's own page content with a source chip,
// better picks that really are better for the answers, and a two-tap box that writes to "How does it play?".
// Site flag: lib/thread/sites.ts fitCoreSite. The earlier card (app/thread/live/racket-v7b.tsx FitCard) stays for rollback.
import { marked, type PageContent } from "../racket-page";

export type FitTone = "pos" | "mix" | "neg";
export type FitLine = { tone: FitTone; title: string; text: string; chip: string | null; for: string[] };
export type FitPicks = { level: string | null; style: string | null; arm: boolean };
/** The fit label, words only (no score numbers on the page). */
export const FIT_LABEL = { good: "Good fit", maybe: "Could work", no: "Probably not", thin: "Not enough to go on" } as const;
type SrcKind = "player" | "youtube" | "reddit" | "blog" | "forum";

const plain = (t: string) => marked(t).map(x => x.text).join("").trim();
/** A line that starts by repeating its title ("Heavier than the label: often 380 g…") keeps only the rest ("Often 380 g…"). */
export function noRepeat(title: string, text: string): string {
  const t = title.replace(/\.$/, "");
  if (!text.toLowerCase().startsWith(t.toLowerCase())) return text;
  const rest = text.slice(t.length).replace(/^[\s:,.;]+/, "");
  return rest ? rest[0].toUpperCase() + rest.slice(1) : text;
}
const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** The source chip under a line: what its reports are, from the page's own list ("1 player review · 2 YouTube reviews");
 *  reports not listed on the page count as "N more sources". Null with no reports. */
export function chipFor(src: string[], kinds: Record<string, SrcKind>): string | null {
  const ids = [...new Set(src)];
  if (!ids.length) return null;
  const c = { player: 0, reddit: 0, youtube: 0, blog: 0, more: 0 };
  for (const id of ids) { const k = kinds[id]; if (!k) c.more++; else if (k === "forum") c.blog++; else c[k]++; }
  const parts = [c.player && n(c.player, "player review", "player reviews"), c.reddit && n(c.reddit, "Reddit thread", "Reddit threads"),
    c.youtube && n(c.youtube, "YouTube review", "YouTube reviews"), c.blog && n(c.blog, "blog", "blogs")].filter(Boolean) as string[];
  if (c.more) parts.push(parts.length ? n(c.more, "more source", "more sources") : n(c.more, "source", "sources"));
  return parts.slice(0, 3).join(" · ");
}

/** The page content as fit lines: plain text (no == marks), the title as the bold lead, a chip from its reports. */
export function contentLines(c: PageContent | null, kinds: Record<string, SrcKind>): { yes: FitLine[]; no: FitLine[] } {
  const line = (tone: FitTone) => (i: PageContent["yes"][number]): FitLine =>
    ({ tone, title: i.title.replace(/\.?$/, "."), text: noRepeat(i.title, plain(i.t)), chip: chipFor(i.src, kinds), for: i.for ?? [] });
  return { yes: (c?.yes ?? []).map(line("pos")), no: (c?.no ?? []).map(line("neg")) };
}

/** A line about level when the racket is rated well above the player's level (suits from the engine's facts). */
export function levelLine(p: FitPicks, suits: Suits | null | undefined): FitLine | null {
  if (!p.level || p.level === "advanced" || !suits) return null;
  if (at(suits, p.level) >= suits.advanced - 15) return null;
  return { tone: "mix", title: "Made for stronger players.", text: "Demo it first if you are still building technique.", chip: null, for: [] };
}

const matches = (p: FitPicks) => (l: FitLine) => (!!p.level && l.for.includes(p.level)) || (!!p.style && l.for.includes(p.style)) || (p.arm && l.for.includes("arm"));
/** Up to three lines for these picks: the best strength for them, a caution (the level line, else a second downside that
 *  matters to them), and the downside that matters most to them. */
export function pickLines(yes: FitLine[], no: FitLine[], p: FitPicks, level: FitLine | null): FitLine[] {
  const hit = matches(p), good = yes.find(hit) ?? yes[0], negs = no.filter(hit), bad = negs[0] ?? no[0];
  const caution = level ?? (negs[1] ? { ...negs[1], tone: "mix" as const } : null);
  return [good, caution, bad].filter((x): x is FitLine => !!x);
}

/** The better-picks data per racket (app/api/fit-picks): the tags its downsides matter for, and its strengths. */
export type PickData = Record<string, { no: string[]; yes: { for: string[]; t: string }[] }>;
export function pickData(all: Record<string, PageContent>): PickData {
  return Object.fromEntries(Object.entries(all).map(([slug, c]) => [slug, {
    no: [...new Set(c.no.flatMap(i => i.for ?? []))], yes: c.yes.map(i => ({ for: i.for ?? [], t: plain(i.t) })) }]));
}

type Suits = { beginner: number; intermediate: number; advanced: number };
type Facts = { suits?: Suits | null; fine?: { forgiveness?: number | null } | null };
const at = (s: Suits, l: string) => s[l as keyof Suits] ?? 0;
export type PickCand = { id: string; row: string; slug: string; pct: number; facts: Facts };
export type BetterPick = { id: string; slug: string; why: string };
/** Better picks (owner 2026-11-22: never a harder racket after "this one is too much for you"). A candidate must suit the
 *  player's level at least as well as advanced players; when this racket is rated above their level it must also be more
 *  forgiving; none of its downsides may matter for their level (or a sore arm with Arm comfort); and one of its strengths
 *  must match what they asked for. Then the best fit first. */
export function betterPicks(self: PickCand, cands: PickCand[], data: PickData, p: FitPicks, count = 3): BetterPick[] {
  const L = p.level, sf = self.facts.suits;
  if (!L || !p.style) return [];
  const harder = L !== "advanced" && !!sf && at(sf, L) < sf.advanced;
  const forgive = self.facts.fine?.forgiveness ?? 0;
  const out: (BetterPick & { pct: number })[] = [];
  for (const c of cands) {
    if (c.id === self.id || c.row === self.row || c.row !== c.id) continue;
    const s = c.facts.suits, d = data[c.slug];
    if (!d || (L !== "advanced" && (!s || at(s, L) < s.advanced))) continue;
    if (harder && !((c.facts.fine?.forgiveness ?? 0) > forgive)) continue;
    if (d.no.some(t => t === L || (p.arm && t === "arm"))) continue;
    const styled = d.yes.find(y => y.for.includes(p.style!));
    if (!styled) continue;
    const why = (p.arm ? d.yes.find(y => y.for.includes("arm")) : null) ?? styled;
    out.push({ id: c.id, slug: c.slug, why: why.t, pct: c.pct });
  }
  return out.sort((a, b) => b.pct - a.pct || a.slug.localeCompare(b.slug)).slice(0, count).map(({ id, slug, why }) => ({ id, slug, why }));
}

/** The two-tap box's chips: "How does it play?" answers players can confirm in one tap, from the racket's prefill (its spec
 *  first, else the leading answer), for Plays like, Sweet spot and Arm friendly. */
const TAP: Record<string, Record<string, string>> = {
  plays_like: { control: "Plays like control", all_round: "Plays all-round", power: "Plays like power" },
  sweet_spot: { big: "Big sweet spot", medium: "Medium sweet spot", small: "Small sweet spot" },
  arm: { very: "Easy on my arm", somewhat: "Fairly easy on my arm", not_really: "Hard on my arm" },
};
const FALLBACK: Record<string, string> = { sweet_spot: "medium", arm: "very" };
export type TapChip = { group: string; choice: string; label: string };
export function tapChips(seed: { groups: Record<string, Record<string, number>>; spec: Record<string, string> } | null): TapChip[] {
  return Object.keys(TAP).flatMap(g => {
    // The leading answer only when it leads (a 1–1–1 tie says nothing).
    const top = Object.entries(seed?.groups[g] ?? {}).sort((a, b) => b[1] - a[1]), lead = top[0] && (!top[1] || top[0][1] > top[1][1]) ? top[0][0] : undefined;
    const choice = [seed?.spec[g], lead, FALLBACK[g]].find(x => x && TAP[g][x]);
    return choice ? [{ group: g, choice, label: TAP[g][choice] }] : [];
  });
}

/** The heading's line: honest about where the opinions come from (never "N players voted" for mixed sources). */
export function fitSub(opinions: number, playerReviews: number): string {
  if (opinions <= 0) return "Pick how you play for a quick fit.";
  return playerReviews > 0 ? `Pick how you play. The answer comes from ${opinions} opinions from players and reviews across the web.`
    : `Pick how you play. The answer comes from ${opinions} opinions in reviews across the web.`;
}
