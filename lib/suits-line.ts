// "Usually best for …" (owner 2026-11-19): one plain line on the fit card before the visitor answers, from the product's own
// data (the level suits, the style lean, the arm bar), in the site's words. No counts, no "we", ≤ 105 characters, and none
// when there is too little to say.
const MAX = 105;
const and = (xs: string[]) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** The padel family: `level` "intermediate → advanced", `lean` "control" (a style word), `use` a type-picker site's lean
 *  ("turnovers and hyzer flips"), `arm` "sore arms", `people` the site's word ("players", "drivers"). */
export function suitsLine({ level, lean, use, arm, people }: { level: string | null; lean: string | null; use: string | null; arm: string | null;
  people: string }): string | null {
  const lvl = level ? level.replace(/\s*→\s*/g, " to ") : null;
  const who = lvl || lean ? `${[lvl, lean].filter(Boolean).join(" ")} ${people}` : null;
  const tries = [[who, use ? `for ${use}` : null, arm ? `${who ? "and " : ""}${people} with ${arm}` : null], [who, null, arm ? `${who ? "and " : ""}${people} with ${arm}` : null], [who, null, null]];
  for (const t of tries) {
    const parts = t.filter((x): x is string => !!x);
    if (!parts.length) continue;
    const s = `Usually best for ${parts.join(", ")}.`;
    if (s.length <= MAX) return s;
  }
  return null;
}

/** SkinRecs: the skin types it suits ("Dry skin", "Sensitive skin") as "Usually best for dry and sensitive skin." */
export function skinSuitsLine(labels: string[]): string | null {
  if (!labels.length) return null;
  const low = labels.map(l => l.toLowerCase());
  const s = low.every(l => / skin$/.test(l)) ? `Usually best for ${and(low.map(l => l.replace(/ skin$/, "")))} skin.` : `Usually best for ${and(low)}.`;
  return s.length <= MAX ? s : skinSuitsLine(labels.slice(0, -1));
}
