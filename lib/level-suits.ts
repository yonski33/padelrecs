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
  /** A pro / competition line (lib/niche fit.proLines). */
  proLine?: boolean;
  /** Reports calling it demanding (tag mentions). */
  demanding?: number;
  /** A shape kept out of the beginner lists (lib/niche fit.beginnerShapesOut: diamond). */
  hardShape?: boolean;
  /** A line the owner names as beginner-friendly (fit.beginnerLines). */
  beginnerLine?: boolean;
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
  // Level caps (owner 2026-11-15: pro lines "are meant for advanced players, they can never show if someone picks
  // intermediate"). "Built for advanced": a pro line, or 3+ voices putting it at advanced (players, YouTube channels whose band
  // is advanced only, reports calling it demanding). With the brand's "advanced" label that caps intermediate at 35; for
  // beginners it caps at 25 whatever the brand says. Players at that level vouching (3+ voices, more for than against) lift
  // the cap, so a brand label alone never empties a level's list. An expert level replaces all of this (app/match-context.ts).
  const at = (lv: number) => (x.players ?? []).filter(p => p.level === lv);
  const vouch = (lv: number) => { const v = at(lv), yes = v.filter(p => p.liked !== false).length; return yes >= 3 && yes > v.length - yes; };
  const advVoices = at(2).filter(p => p.liked !== false).length + (x.youtube && x.youtube.from === 2 ? x.youtube.channels : 0) + (x.demanding ?? 0);
  const builtForAdvanced = !!x.proLine || advVoices >= 3;
  if (builtForAdvanced && x.brand && x.brand.from === 2 && !vouch(1)) { s[1] = Math.min(s[1], 35); s[0] = Math.min(s[0], 25); }
  if (builtForAdvanced && !vouch(0)) s[0] = Math.min(s[0], 25);
  // Diamonds (owner 2026-11-15: "very few diamond rackets can be played by beginners") stay out of the beginner lists too.
  if (x.hardShape && !vouch(0)) { s[0] = Math.min(s[0], 25); basis.push("its shape"); }
  // …except the lines the owner names as beginner-friendly.
  if (x.beginnerLine) { s[0] = Math.max(s[0], 65); basis.push("the owner's beginner list"); }
  // …and it is an advanced player's racket, so it always shows for advanced players.
  if (builtForAdvanced) { s[2] = Math.max(s[2], 70); basis.push(x.proLine ? "a pro line" : "advanced players"); }
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
