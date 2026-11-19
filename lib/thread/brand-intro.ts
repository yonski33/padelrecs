// The Thread brand page's intro (app/thread/brands/[slug]): what the numbers say, in plain words, with counts under 5 left
// out. No "we", no dashes. Pure, for tests.
const MIN = 1; // real counts at any size (owner 2026-11-19); 0 is left out
const n = (x: number, one: string) => `${x.toLocaleString("en-US")} ${x === 1 ? one : `${one}s`}`;
export function brandIntro(name: string, models: number, reviews: number, top: { name: string; score: number } | null) {
  const counts = [models >= MIN ? n(models, "current racket") : "", reviews >= MIN ? n(reviews, "player review") : ""].filter(Boolean);
  const first = counts.length ? `${name}: ${counts.join(", ")}.` : `${name} rackets that players have reviewed.`;
  return top ? `${first} Top player score: ${top.score}, the ${top.name}.` : first;
}
