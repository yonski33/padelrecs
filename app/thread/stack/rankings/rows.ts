// A StackRecs ranking's rows (lib/stack/rankings.ts): a category by score (scored tools only), a vote board by votes.
import type { StackRanking } from "../../../../lib/stack/rankings";
import { boardTop, type stackData, type StackRow } from "../data";

export function rankingRows(d: Awaited<ReturnType<typeof stackData>>, l: StackRanking, size = 50): { r: StackRow; n: number | null }[] {
  if (l.kind === "board") return boardTop(d, l.side, l.trait, l.choice, size);
  return d.rows.filter(r => r.shape === l.category && r.score != null).sort((a, b) => b.score! - a.score! || b.n - a.n).slice(0, size).map(r => ({ r, n: null }));
}
