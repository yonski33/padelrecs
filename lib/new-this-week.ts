// "N new this week" means one thing on every page (audit 2026-11-15, #12): reviews and reports added to the site in the last
// 7 days, of every kind, by when they were added (not when the source was written).
export const WEEK_MS = 7 * 864e5;
export function newThisWeek(data: { reviews: { createdAt: string }[]; external: { createdAt: string }[] }, now: number) {
  return [...data.reviews, ...data.external].filter(x => Date.parse(x.createdAt) >= now - WEEK_MS).length;
}
