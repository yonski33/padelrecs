/** Small readers for spec text: "360–375 g", "365 g (± 10 g)", "55/65/75/85\"", "7 pts HL strung". */

/** The spec as text, or "" when missing. */
export const text = (v: unknown) => typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";

/** Every number in the text, in order ("1.5" and "1,5" both read as 1.5). Signs are kept for "-1" style ratings. */
export function numbers(s: string): number[] {
  return [...s.replace(/(\d),(\d)/g, "$1.$2").matchAll(/[-−]?\d+(?:\.\d+)?/g)].map(m => Number(m[0].replace("−", "-")));
}

/** A stated range ("360–375 g", "360 - 375g", "365g–370g") as [low, high], or a single value as [v, v]; tolerances
 *  ("± 10 g") are ignored. A range in brackets after a single value wins: "370 g (361–375 g)" reads as 361–375. */
export function range(s: string): [number, number] | null {
  const clean = s.replace(/\(?\s*±\s*\d+(?:\.\d+)?\s*\w*\s*\)?/g, " ");
  const r = clean.match(/(\d+(?:[.,]\d+)?)\s*\w*\s*[–—-]\s*(\d+(?:[.,]\d+)?)/);
  if (r) { const a = Number(r[1].replace(",", ".")), b = Number(r[2].replace(",", ".")); return a <= b ? [a, b] : [b, a]; }
  const n = numbers(clean).filter(x => x > 0);
  return n.length ? [n[0], n[0]] : null;
}

/** Case-insensitive test. */
export const has = (s: string, re: RegExp) => re.test(s);
