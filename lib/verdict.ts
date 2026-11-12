// Owner decision 2026-11-12: user reviews use the same three verdicts as web reviews (positive / mixed / negative)
// instead of 1–5 stars. The verdict is kept in the existing `rating` column: positive is saved as 5, mixed as 3 and
// negative as 1, and older 1–5 ratings read the same way as before (4–5 positive, 3 mixed, 1–2 negative; ratingVerdict
// in lib/top-lists.ts), so every past review keeps its verdict without being rewritten.
import { ratingVerdict, type Verdict } from "./top-lists";

export const VERDICTS = ["positive", "mixed", "negative"] as const;
export const verdictRating: Record<Verdict, number> = { positive: 5, mixed: 3, negative: 1 };
export const verdictWord: Record<Verdict, string> = { positive: "Positive", mixed: "Mixed", negative: "Negative" };
/** The verdict an older 1–5 rating stands for, as the rating value the form now saves. */
export const normalizedRating = (rating: number) => verdictRating[ratingVerdict(rating)];
export { ratingVerdict };
