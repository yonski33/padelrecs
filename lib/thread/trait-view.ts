import { TRAIT_GROUPS, type TraitGroup } from "./traits";
// How one "How does it play?" group shows (owner 2026-11-19): review mentions (db/thread/padel-traits.json) and players'
// votes add up per option, and every option with any shows its real count and bar, 1 included (owner: no "under 5" rule
// in the vote widgets; a tap visibly adds 1). A group with no counts at all can show the spec that settles it (a diamond
// shape → Power), labelled as the specs. Pure: the grid renders it and tests check it.
export const MIN_MENTIONS = 1;
export type GroupView = {
  /** Per option: reviews + votes, and whether it shows (5+). */ opts: { key: string; label: string; n: number; shown: boolean; top: boolean; spec: boolean }[];
  reviews: number; votes: number; anyShown: boolean; specOnly: boolean;
};
/** `tieNone` (PadelRecs racket page, owner mock 2026-11-21): when two answers share the lead, neither is highlighted. */
export function groupView(options: [string, string][], reviews: Record<string, number> | undefined, votes: Record<string, number> | undefined, spec: string | undefined, tieNone = false): GroupView {
  const r = (k: string) => reviews?.[k] ?? 0, v = (k: string) => votes?.[k] ?? 0;
  const rows = options.map(([key, label]) => ({ key, label, n: r(key) + v(key) }));
  const shownRows = rows.filter(x => x.n >= MIN_MENTIONS), anyShown = shownRows.length > 0, max = Math.max(0, ...shownRows.map(x => x.n));
  const specOnly = !anyShown && !!spec && options.some(([k]) => k === spec);
  const tied = tieNone && shownRows.filter(x => x.n === max).length > 1;
  const opts = rows.map(x => ({ ...x, shown: x.n >= MIN_MENTIONS, top: anyShown && !tied && x.n === max, spec: specOnly && x.key === spec }));
  if (anyShown) opts.sort((a, b) => b.n - a.n);
  return { opts, reviews: options.reduce((s, [k]) => s + r(k), 0), votes: options.reduce((s, [k]) => s + v(k), 0), anyShown, specOnly };
}
/** The group's small count line: "12 reviews", "12 reviews, 3 votes", "3 votes", or "From the specs". Only counts what shows. */
export function groupNote(g: GroupView): string {
  if (g.specOnly) return "From the specs";
  if (!g.anyShown) return "";
  const p = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  return [g.reviews ? p(g.reviews, "review") : "", g.votes ? p(g.votes, "vote") : ""].filter(Boolean).join(", ");
}
/** The line above the vote grid on every Thread site, phone and desktop, voted or not (owner 2026-11-20: was "From 82
 *  reviews and 24 player votes. Pick what fits. Tap again to remove." and its variants). */
export const SECTION_NOTE = "Tap to vote";
/** The counts typed into the form: one whole number 0–100000 per option ("c_<option>"), blanks as 0. */
export function countsFrom(trait: string, form: Record<string, unknown>, groups = TRAIT_GROUPS, prefix = "c_"): Record<string, number> | null {
  const g = groups.find(x => x.key === trait)!, out: Record<string, number> = {};
  for (const [k] of g.options) {
    const raw = String(form[`${prefix}${k}`] ?? "").trim(), n = raw === "" ? 0 : Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return null;
    if (n > 0) out[k] = n;
  }
  return out;
}

/** The admin's one form for every group (Save all, or one group's Save via `only`): fields are c_<group>__<option>, with the
 *  value shown when the page loaded in o_<group>__<option>. Returns the groups to save (`only`, or every group whose numbers
 *  changed), or null when a number is not a whole number from 0 to 100,000. Pure, for tests. */
export function changedCounts(form: Record<string, unknown>, groups = TRAIT_GROUPS): { trait: string; counts: Record<string, number> }[] | null {
  const only = typeof form.only === "string" && form.only ? form.only : null, out: { trait: string; counts: Record<string, number> }[] = [];
  for (const g of groups) {
    if (only && g.key !== only) continue;
    const now = countsFrom(g.key, form, groups, `c_${g.key}__`); if (!now) return null;
    const was = countsFrom(g.key, form, groups, `o_${g.key}__`) ?? {};
    const same = g.options.every(([k]) => (now[k] ?? 0) === (was[k] ?? 0));
    if (only || !same) out.push({ trait: g.key, counts: now });
  }
  return out;
}

/** A product's overall tally (Loved it / Mixed / Not for me), editable in the Traits tab (owner 2026-11-20). The override
 *  is a trait_overrides row under this key (no migration: same table and checks as the trait groups); without one, the
 *  tally is counted from the reviews (db/data.ts score). It edits the shown tally only; the score badge stays counted. */
export const SENTIMENT_KEY = "_sentiment";
export const SENTIMENT_GROUP: TraitGroup = { key: SENTIMENT_KEY, title: "Overall opinions",
  options: [["positive", "Loved it"], ["mixed", "Mixed"], ["negative", "Not for me"]] };
export type Tally = { pos: number; mix: number; neg: number };
/** The tally a page shows: the owner's override when saved (a missing option is 0), else the counted one. */
export function tallyWith(counted: Tally, override: Record<string, number> | null | undefined): Tally {
  return override ? { pos: override.positive ?? 0, mix: override.mixed ?? 0, neg: override.negative ?? 0 } : counted;
}
