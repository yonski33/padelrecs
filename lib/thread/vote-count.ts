// The poll's count line on the creator page (PR #649). Its own file, no imports, so the client poll stays light.
/** "Be the first to vote" at zero (owner 2026-11-22: never "0 votes"), else the plain count, no hiding of low numbers. */
export const voteCountLine = (n: number) => n > 0 ? `${n} vote${n === 1 ? "" : "s"}` : "Be the first to vote";
