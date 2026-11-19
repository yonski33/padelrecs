import { TRAIT_GROUPS } from "./traits";
import { W } from "./words";
// How one "How does it play?" group shows (owner 2026-11-19): review mentions (db/thread/padel-traits.json) and players'
// votes add up per option, and every option with any shows its real count and bar, 1 included (owner: no "under 5" rule
// in the vote widgets; a tap visibly adds 1). A group with no counts at all can show the spec that settles it (a diamond
// shape → Power), labelled as the specs. Pure: the grid renders it and tests check it.
export const MIN_MENTIONS = 1;
export type GroupView = {
  /** Per option: reviews + votes, and whether it shows (5+). */ opts: { key: string; label: string; n: number; shown: boolean; top: boolean; spec: boolean }[];
  reviews: number; votes: number; anyShown: boolean; specOnly: boolean;
};
export function groupView(options: [string, string][], reviews: Record<string, number> | undefined, votes: Record<string, number> | undefined, spec: string | undefined): GroupView {
  const r = (k: string) => reviews?.[k] ?? 0, v = (k: string) => votes?.[k] ?? 0;
  const rows = options.map(([key, label]) => ({ key, label, n: r(key) + v(key) }));
  const shownRows = rows.filter(x => x.n >= MIN_MENTIONS), anyShown = shownRows.length > 0, max = Math.max(0, ...shownRows.map(x => x.n));
  const specOnly = !anyShown && !!spec && options.some(([k]) => k === spec);
  const opts = rows.map(x => ({ ...x, shown: x.n >= MIN_MENTIONS, top: anyShown && x.n === max, spec: specOnly && x.key === spec }));
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
/** The section's line on phones, short enough for one or two lines (owner 2026-11-19). */
export function sectionNoteShort(sources: number, votes: number): string {
  if (sources > 0 && votes > 0) return `From ${sources} reviews and ${votes} ${votes === 1 ? "vote" : "votes"}. Tap again to remove.`;
  if (sources > 0) return `Based on ${sources} ${sources === 1 ? "review" : "reviews"}. Tap again to remove.`;
  return "One vote per group. Tap again to remove.";
}
/** The section's line under the heading. */
export function sectionNote(sources: number, votes: number): string {
  if (sources > 0 && votes === 0) return `Based on ${sources} ${sources === 1 ? "review" : "reviews"} until ${W.people} vote. Pick what fits. Tap again to remove.`;
  if (sources > 0) return `From ${sources} reviews and ${votes} player ${votes === 1 ? "vote" : "votes"}. Pick what fits. Tap again to remove.`;
  return "Pick what fits. One vote per group. Tap again to remove.";
}
/** The counts typed into the form: one whole number 0–100000 per option ("c_<option>"), blanks as 0. */
export function countsFrom(trait: string, form: Record<string, unknown>, groups = TRAIT_GROUPS): Record<string, number> | null {
  const g = groups.find(x => x.key === trait)!, out: Record<string, number> = {};
  for (const [k] of g.options) {
    const raw = String(form[`c_${k}`] ?? "").trim(), n = raw === "" ? 0 : Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 100000) return null;
    if (n > 0) out[k] = n;
  }
  return out;
}
