// "N opinions collected this week" means one thing on every page (audit 2026-11-15, #12; Grok pickleball audits 2026-11-17
// #17 and 2026-11-18): every review and web opinion the site collected (our own reviews, YouTube, forums and blogs) in the
// last 7 full days (UTC), by when it was collected, not when the source was written. The window ends at the start of today, so
// pages cached at different hours of the same day show the same number.
export const WEEK_MS = 7 * 864e5;
const DAY_MS = 864e5;
/** The week's window: [start, end) in ms, both on a UTC midnight. */
export function weekWindow(now: number): [number, number] {
  const end = Math.floor(now / DAY_MS) * DAY_MS;
  return [end - WEEK_MS, end];
}
export function newThisWeek(data: { reviews: { createdAt: string }[]; external: { createdAt: string }[] }, now: number) {
  const [from, to] = weekWindow(now);
  return [...data.reviews, ...data.external].filter(x => { const t = Date.parse(x.createdAt); return t >= from && t < to; }).length;
}
/** The short label beside the number (home pills, ranking tiles). */
export const WEEK_SHORT = "opinions collected this week";
/** The full label (the /reviews page). */
export const WEEK_LONG = "opinions collected from YouTube, forums and reviews this week";
