// The Thread brand page's intro (app/thread/brands/[slug]): what the numbers say, in plain words, with counts under 5 left
// out. No "we", no dashes. Pure, for tests.
const MIN = 1; // real counts at any size (owner 2026-11-19); 0 is left out
const n = (x: number, one: string) => `${x.toLocaleString("en-US")} ${x === 1 ? one : `${one}s`}`;
/** `loved`: say the most loved model by its loved count instead of a score (PickleballRecs, owner 2026-11-24, Grok audit #99). */
export function brandIntro(name: string, models: number, reviews: number, top: { name: string; score: number } | null, one = "racket",
  loved?: { name: string; pos: number } | null) {
  const counts = [models >= MIN ? n(models, `current ${one}`) : "", reviews >= MIN ? n(reviews, "player review") : ""].filter(Boolean);
  const first = counts.length ? `${name}: ${counts.join(", ")}.` : `${name} ${one}s that players have reviewed.`;
  if (loved !== undefined) return loved && loved.pos > 0 ? `${first} Most loved: the ${loved.name}, loved by ${n(loved.pos, "player")}.` : first;
  return top ? `${first} Top player score: ${top.score}, the ${top.name}.` : first;
}
