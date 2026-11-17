// How a Player score shows when it rests on few reviews (owner 2026-11-17): under NEW_UNDER reviews with a verdict, no number
// at all ("New · 6 reviews so far" in a neutral pill), since a 64 on six reviews reads as "bad" when it means "new". Above
// that the plain score (the owner dropped the "early" tag for 10–19). Everywhere a score shows: lists, cards, hero, compare.
export const NEW_UNDER = 10;
export type ScoreState = "new" | "full";
export const scoreState = (judged: number): ScoreState => judged < NEW_UNDER ? "new" : "full";
export const newLine = (n: number) => `New · ${n} ${n === 1 ? "review" : "reviews"} so far`;

/** The compare page shows each product's review count, not its Player score, before any picks (owner 2026-11-17): the score
 *  sits next to the trait dots there, and a high score beside weaker dots than the next column reads as a contradiction. The score
 *  stays on lists, cards and the product hero. Set to false to show review counts there instead (owner undecided; default as before). */
export const COMPARE_SHOWS_SCORE = true;
