// PadelRecs racket page, one community feed (owner OK 2026-11-21): the site's player reviews and the discussion's top-level
// posts in one list, "Players on the <model> (N)". Display only: nothing merges in the database, reviews still feed the poll
// and the loved / mixed counts, posts never do. Pure, so the tests see exactly what the page shows.

export type Flair = "review" | "question" | "tip";
export const FLAIR_WORD: Record<Flair, string> = { review: "Review", question: "Question", tip: "Tip" };

/** Words a question usually starts with ("Is it ok…", "Anyone tried…", "Thoughts on…"). */
const ASKS = /^(how|what|which|why|when|where|who|whose|is|are|am|was|were|do|does|did|can|could|should|would|will|has|have|had|any|anyone|anybody|thoughts|opinions|help)\b/i;

/** QUESTION or TIP for a discussion post. The comments table's is_question column is never set (db/comments.ts: always
 *  false), so the post's own words decide: a question when it ends with "?" or starts with a question word, else a tip.
 *  A leading "@Name " (a reply to a reply) is ignored. This is the one place the rule lives. */
export function postFlair(body: string): Exclude<Flair, "review"> {
  const t = body.trim().replace(/^@\S+\s+/, "");
  return /\?["”')\s]*$/.test(t) || ASKS.test(t) ? "question" : "tip";
}

/** A thread's last activity: its own time, or its newest reply's, so a reply bumps the thread in "Newest activity". */
export const activity = (at: string, replies: { at: string }[]) => replies.reduce((m, r) => r.at > m ? r.at : m, at);

/** Replies shown under a post before "View N more replies". */
export const REPLIES_SHOWN = 2;

/** The header line under "Players on the …": the mix of the feed, then the outside summaries ("2 reviews · 4 questions ·
 *  1 tip · 13 from around the web"); only the parts there are. */
export function feedLine(n: { review: number; question: number; tip: number }, web: number) {
  const part = (k: number, one: string, many: string) => k > 0 ? `${k.toLocaleString("en-US")} ${k === 1 ? one : many}` : "";
  return [part(n.review, "review", "reviews"), part(n.question, "question", "questions"), part(n.tip, "tip", "tips"),
    web > 0 ? `${web.toLocaleString("en-US")} from around the web` : ""].filter(Boolean).join(" · ") || "No posts yet";
}
