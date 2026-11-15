// The expert yardstick (ENGINE-PLAN.md section F): how close the site's dots are to an expert's 1–10 ratings
// (db/known-dots/<niche>.json `expert`). Pure, so tests can feed plain numbers.

/** Average ranks (ties share their mean rank). */
function ranks(xs: number[]): number[] {
  const idx = xs.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(xs.length);
  for (let i = 0; i < idx.length;) {
    let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) out[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return out;
}
/** Spearman rank correlation with ties (Pearson on average ranks); 0 when either side doesn't vary. */
export function spearman(a: number[], b: number[]): number {
  const ra = ranks(a), rb = ranks(b), n = a.length;
  const ma = ra.reduce((s, x) => s + x, 0) / n, mb = rb.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) ** 2; db += (rb[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
}
/** Points off on the expert's 1–10 scale: dots × 2 against the rating. More than 2 points = more than 1 dot off. */
export const pointsOff = (dots: number, expert: number) => Math.abs(dots * 2 - expert);
