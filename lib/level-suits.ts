// Level as a "suits" score (owner 2026-11-15, ENGINE-PLAN attribute kind "suits"): 0–100 per level (beginner, intermediate,
// advanced) for how well a racket suits players at that level. Quick match and the fit check rank by it instead of cutting by a
// band, so a racket is never left out of a level's results by one label. Built from, strongest first:
//   players   level-tagged reports: the reader's "suits X" rows, and writers who state their level and liked it (or didn't);
//   YouTube   reviewers' level band, when 2+ channels agree (db/level-sources);
//   proxy     forgiving vs demanding evidence (beginners and intermediates gain from a forgiving racket);
//   brand     a weak prior. Owner: brands label most rackets "advanced / professional", which is mostly marketing, so it only
//             nudges; explicit beginner / intermediate labels and "not for beginners" carry more.
// Neutral is 50; nothing known stays 50, so a thin-data racket with only "brand: advanced" sits mid for intermediates.
// Pure, so tests feed plain objects.

export const LEVEL_NAMES = ["beginner", "intermediate", "advanced"] as const;
export type LevelName = typeof LEVEL_NAMES[number];
export type Band = { from: number; to: number };
export type SuitsInput = {
  brand?: Band & { notForBeginners?: boolean };
  youtube?: Band & { channels: number };
  /** One per player voice: the level they put it at, and whether it worked for them (null: they say it suits that level). */
  players?: { level: number; liked: boolean | null }[];
  /** Forgiveness praise and complaints (weighted, lib/evidence.ts evidenceBalance). */
  forgiveness?: { P: number; C: number };
};
export type Suits = Record<LevelName, number> & { basis: string[] };

const SPAN = ["beginner", "intermediate", "advanced"];
export const bandWords = (b: Band) => b.from === b.to ? SPAN[b.from] : `${SPAN[b.from]} to ${SPAN[b.to]}`;
const inBand = (b: Band, i: number) => i >= b.from && i <= b.to;
const away = (b: Band, i: number) => i < b.from ? b.from - i : i > b.to ? i - b.to : 0;

export function levelSuits(x: SuitsInput): Suits {
  const s = [50, 50, 50], basis: string[] = [];
  // Players: +1 at their level when it suits / worked, −0.5 when it didn't; half to the next level, against two away.
  if (x.players?.length) {
    const support = [0, 0, 0];
    for (const p of x.players) {
      const w = p.liked === false ? -0.5 : 1;
      for (let i = 0; i < 3; i++) { const d = Math.abs(i - p.level); support[i] += w * (d === 0 ? 1 : d === 1 ? 0.5 : -0.5); }
    }
    for (let i = 0; i < 3; i++) s[i] += 28 * Math.tanh(support[i] / 3);
    basis.push(`${x.players.length} ${x.players.length === 1 ? "player" : "players"}`);
  }
  if (x.youtube && x.youtube.channels >= 2) {
    for (let i = 0; i < 3; i++) s[i] += inBand(x.youtube, i) ? Math.min(20, 6 * x.youtube.channels) : away(x.youtube, i) === 1 ? -8 : -15;
    basis.push(`${x.youtube.channels} reviewers`);
  }
  if (x.forgiveness && x.forgiveness.P + x.forgiveness.C > 0) {
    const f = (x.forgiveness.P - x.forgiveness.C) / (x.forgiveness.P + x.forgiveness.C + 4);
    s[0] += 15 * f; s[1] += 6 * f;
  }
  if (x.brand) {
    const b = x.brand;
    if (b.to <= 1 || b.from === 0) {
      // An explicit beginner / intermediate label means something.
      for (let i = 0; i < 3; i++) s[i] += inBand(b, i) ? 12 : away(b, i) === 1 ? -6 : -12;
    } else {
      // "Advanced" / "intermediate-advanced": a nudge only, never against intermediates.
      s[2] += 4; s[0] -= 5;
    }
    if (b.notForBeginners) s[0] -= 12;
    basis.push("the brand");
  }
  const clamp = (v: number) => Math.round(Math.max(5, Math.min(95, v)));
  return { beginner: clamp(s[0]), intermediate: clamp(s[1]), advanced: clamp(s[2]), basis };
}

/** "Sources disagree: the brand says advanced; 3 YouTube reviewers say beginner to intermediate." when the brand's band and
 *  the reviewers' (2+ channels) or the players' (3+ voices, most common level) don't overlap. */
export function levelDisagreement(x: SuitsInput): string | null {
  if (!x.brand) return null;
  const others: string[] = [];
  if (x.youtube && x.youtube.channels >= 2 && (x.youtube.to < x.brand.from || x.youtube.from > x.brand.to))
    others.push(`${x.youtube.channels} YouTube reviewers say ${bandWords(x.youtube)}`);
  const liked = (x.players ?? []).filter(p => p.liked !== false);
  if (liked.length >= 3) {
    const n = [0, 1, 2].map(i => liked.filter(p => p.level === i).length), top = n.indexOf(Math.max(...n));
    if (n[top] * 2 > liked.length && !inBand(x.brand, top)) others.push(`${n[top]} players put it at ${SPAN[top]}`);
  }
  return others.length ? `Sources disagree: the brand says ${bandWords(x.brand)}; ${others.join(", ")}.` : null;
}
