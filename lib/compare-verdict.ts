// The compare page's verdict (owner 2026-11-17, Claude Design mock "Compare v3"): one headline and one line per other product,
// built only from data: the match % and the hard level / arm caps, each product's trait dots (in the site's own words) and its
// own content (catch). Expert voice, no counts, every line ≤ 105 characters. Pure, so the page runs it in the browser on every
// pick change (instant filters) and tests feed it directly.
import { ARM_SHORT } from "./quick-match";

export const MAX_LINE = 105;
export type VTrait = { label: string; /** "more forgiving" (fit-config diff). */ diff: string; /** "want margin for error". */ ifYou: string };
export type VProduct = { id: string; short: string; signal: number | null; dots: number[];
  /** The catch in a few plain words ("a smaller sweet spot"), when known. */ catchShort: string | null };
export type VPick = { pct: number | null; /** Why it is held under "Worth a look" for these picks. */ hard: "level" | "arm" | null; levelWord: string | null };
export type VLine = { pre: string; name: string; post: string };
export type Verdict = { picked: boolean; order: string[]; head: VLine; rest: VLine[] };

const COUNT = ["", "", "two", "three", "four"];
/** "more forgiving" → "the most forgiving", "quicker" → "the quickest", "better in defence" → "the best in defence". */
export function superlative(diff: string): string {
  const [w, ...rest] = diff.split(" "), tail = rest.length ? ` ${rest.join(" ")}` : "";
  if (w === "more") return `the most${tail}`;
  if (w === "better") return `the best${tail}`;
  if (/ier$/.test(w)) return `the ${w.slice(0, -3)}iest${tail}`;
  if (/er$/.test(w)) return `the ${w.slice(0, -2)}est${tail}`;
  return `the most ${diff}`;
}
const NOUN = /^(power|control|spin|pop|glide|grip|feel|touch|comfort|speed|stability|durability)$/;
/** The superlative as a predicate: "has the most power" (a noun, audit 2026-11-17 #29: not "is the most power"), "lasts the
 *  longest", else "is the most forgiving". */
export function bestAt(diff: string): string {
  const [w, ...rest] = diff.split(" ");
  if (w === "more" && rest.length === 1 && NOUN.test(rest[0])) return `has the most ${rest[0]}`;
  if (w === "lasts" && rest[0] === "longer") return "lasts the longest";
  return `is ${superlative(diff)}`;
}
/** The traits where `i` leads every other product (by dots), biggest lead first. */
export function leads(ps: VProduct[], i: number): number[] {
  const me = ps[i].dots;
  return me.map((v, k) => ({ k, g: v ? v - Math.max(...ps.filter((_, j) => j !== i).map(p => p.dots[k] || 0)) : 0 }))
    .filter(x => x.g > 0).sort((a, b) => b.g - a.g || a.k - b.k).map(x => x.k);
}
const fit = (s: string) => s.length <= MAX_LINE;
/** The first wording that fits the 105-character rule (the last one regardless). */
const line = (pre: string, name: string, ...posts: string[]): VLine => ({ pre, name, post: posts.find(x => fit(pre + name + x)) ?? posts[posts.length - 1] });

export function compareVerdict(ps: VProduct[], traits: VTrait[], picks: Record<string, VPick> | null, scoreWord = "player score"): Verdict {
  const picked = !!picks && ps.every(p => picks[p.id] !== undefined) && ps.some(p => picks[p.id].pct !== null);
  const pct = (p: VProduct) => picked ? picks![p.id].pct ?? -1 : -1;
  const order = [...ps].sort((a, b) => picked ? pct(b) - pct(a) || (b.signal ?? -1) - (a.signal ?? -1) : (b.signal ?? -1) - (a.signal ?? -1));
  const ix = (p: VProduct) => ps.indexOf(p);
  const top = order[0], here = ps.length === 2 ? "of the two" : `of the ${COUNT[ps.length] ?? ps.length}`;
  // A superlative ("is the most forgiving") only on a real strength, 4+ dots (Grok pickleball audit 2026-11-17, #26: a paddle
  // whose top complaint is its sweet spot led as "the most forgiving" of two weak ones). The relative lines keep leads().
  const lead = (p: VProduct) => leads(ps, ix(p)).find(k => p.dots[k] >= 4);
  /** Its lead over the others, else its own strongest trait (4+ dots), for "if you …" lines. */
  const strength = (p: VProduct) => { const k = lead(p); if (k !== undefined) return k;
    const top = Math.max(...p.dots); return top >= 4 ? p.dots.indexOf(top) : undefined; };
  const rest: VLine[] = [];
  let head: VLine;
  if (picked) {
    const second = order[1];
    if (second && pct(top) - pct(second) < 3 && !picks![second.id].hard) {
      // A near tie: either works, each for its own strength.
      const a = strength(top), b = strength(second);
      head = a !== undefined && b !== undefined
        ? line("Either works: pick the ", top.short, ` if you ${traits[a].ifYou}, the ${second.short} if you ${traits[b].ifYou}.`,
          ` if you ${traits[a].ifYou}; the ${second.short} is as good a match.`, `; the ${second.short} is as good a match.`)
        : { pre: "Either works: the ", name: top.short, post: ` and the ${second.short} match you about equally.` };
      order.slice(2).forEach(p => rest.push(otherLine(p)));
    } else {
      const a = lead(top);
      head = { pre: "Get the ", name: top.short, post: a !== undefined ? `. ${bestAt(traits[a].diff).replace(/^is /, "It's ").replace(/^(?!It's )/, "It ")} ${here}.` : ". It's the best match for your picks." };
      order.slice(1).forEach(p => rest.push(otherLine(p)));
    }
  } else {
    const a = lead(top);
    head = { pre: "The ", name: top.short, post: ` has the best ${scoreWord} here${a !== undefined ? ` and ${bestAt(traits[a].diff)}` : ""}.` };
    order.slice(1).forEach(p => { const k = lead(p);
      // No lead of its own: no line (never filler).
      if (k !== undefined) rest.push({ pre: "The ", name: p.short, post: ` ${bestAt(traits[k].diff)} ${here}.` }); });
    if (!fit(head.pre + head.name + head.post)) head = { pre: "The ", name: top.short, post: ` has the best ${scoreWord} here.` };
  }
  return { picked, order: order.map(p => p.id), head, rest };

  function otherLine(p: VProduct): VLine {
    const pk = picks![p.id];
    if (pk.hard === "level") return { pre: "Skip the ", name: p.short, post: ` for now: built for ${pk.levelWord ?? "other"} ${ARM_SHORT === "console" ? "racers" : "players"}.` };
    if (pk.hard === "arm") return { pre: "Skip the ", name: p.short, post: ` for now: ${ARM_SHORT === "sore arm" ? "hard on a sore arm" : ARM_SHORT === "console" ? "it's PC only" : "it needs more arm speed"}.` };
    const k = strength(p), why = k !== undefined ? traits[k].ifYou : null;
    if ((pk.pct ?? 0) >= 70 && why) {
      const liveWith = p.catchShort ? ` and can live with ${p.catchShort}` : "";
      return line("Take the ", p.short, ` instead if you ${why}${liveWith}.`, ` instead if you ${why}.`);
    }
    if (p.catchShort) return line("Skip the ", p.short, ` for now: ${p.catchShort}.`, " for now: a weaker match for your picks.");
    return { pre: "Skip the ", name: p.short, post: " for now: a weaker match for your picks." };
  }
}

/** "Where they differ": a row per trait with one clear leader (ties hidden), in the site's own words. */
export function differRows(ps: VProduct[], traits: VTrait[]): { label: string; id: string }[] {
  return traits.flatMap((t, k) => { const vals = ps.map(p => p.dots[k] || 0), m = Math.max(...vals);
    return m && vals.filter(v => v === m).length === 1 ? [{ label: t.diff[0].toUpperCase() + t.diff.slice(1), id: ps[vals.indexOf(m)].id }] : []; });
}

/** A catch line cut to a few plain words for "and can live with …": the first clause, lower-cased, without a final stop. */
export function catchShort(text: string | null | undefined): string | null {
  if (!text) return null;
  const s = text.replace(/==/g, "").split(/[.;:—]|, but /)[0].trim().replace(/^the catch:?\s*/i, "");
  if (!s || s.length > 60) return null;
  return s[0].toLowerCase() + s.slice(1);
}
