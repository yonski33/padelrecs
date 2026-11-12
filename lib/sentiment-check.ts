/**
 * A rough check for web reviews whose sentiment label looks wrong, for the admin's "Maybe wrong sentiment" list.
 * A "positive" review whose summary turns on a complaint ("…but it cracked after a month") or a "negative" one that is
 * mostly praise. It only ranks reviews for a person to look at; it never changes a label by itself.
 */
type Sentiment = "positive" | "mixed" | "negative";

/** Words that undo a positive verdict, with a weight: 2 = a real problem, 1 = a contrast that often stays positive. */
const DOUBTS: [string, number][] = [
  ["returned", 2], ["sent back", 2], ["sent it back", 2], ["refund", 2], ["broke", 2], ["broken", 2], ["cracked", 2],
  ["stopped working", 2], ["died", 2], ["defective", 2], ["disappointed", 2], ["disappointing", 2], ["regret", 2],
  ["unfortunately", 2], ["downside", 2], ["downsides", 2], ["issue", 2], ["issues", 2], ["problem", 2], ["problems", 2],
  ["complaint", 2], ["complaints", 2], ["worse", 2], ["annoying", 2], ["not worth", 2], ["wouldn't recommend", 2], ["would not recommend", 2],
  ["but", 1], ["however", 1], ["though", 1], ["although", 1], ["wish", 1], ["only con", 1], ["drawback", 1], ["mixed", 1],
];
/** Praise that sits oddly in a "negative" review. */
const PRAISE: [string, number][] = [
  ["love", 2], ["loves", 2], ["loved", 2], ["great", 1], ["excellent", 2], ["amazing", 2], ["perfect", 2], ["best", 1],
  ["recommend", 2], ["recommends", 2], ["favorite", 2], ["favourite", 2], ["happy with", 2], ["impressed", 2], ["fantastic", 2],
];

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]");
const pattern = (list: [string, number][]) => new RegExp(`\\b(${list.map(([w]) => escape(w)).join("|")})\\b`, "gi");
const DOUBT_RE = pattern(DOUBTS), PRAISE_RE = pattern(PRAISE);
const weights = (list: [string, number][]) => new Map(list.map(([w, n]) => [w.replace(/'/g, "’"), n]));
const DOUBT_W = weights(DOUBTS), PRAISE_W = weights(PRAISE);

/** Postgres regex (\m and \M are its word edges) that pre-filters candidates in SQL before checkSentiment ranks them. */
export const sqlPattern = (list: [string, number][]) => `\\m(${list.map(([w]) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]")).join("|")})\\M`;
export const DOUBT_SQL = sqlPattern(DOUBTS), PRAISE_SQL = sqlPattern(PRAISE);

/** A negation in the few words before a hit. */
const NEGATED = /\b(no|not|without|none|never|zero|any|free of|nothing|solved|fixed|fixes|avoids|n['’]t)\b[\w\s,-]{0,22}$/i;

export type SentimentCheck = { score: number; words: string[]; suggest: Sentiment | null };

/** How doubtful a label looks (0 = fine), the words behind it, and the label a person would probably pick instead. */
export function checkSentiment(sentiment: Sentiment | null, text: string): SentimentCheck {
  if (sentiment !== "positive" && sentiment !== "negative") return { score: 0, words: [], suggest: null };
  const hits = (re: RegExp, w: Map<string, number>) => {
    // "no issues", "without problems", "hasn't had any complaints": a negated complaint (or praise) doesn't count.
    const found = [...text.matchAll(re)].filter(m => !NEGATED.test(text.slice(Math.max(0, m.index! - 30), m.index)))
      .map(m => m[1].toLowerCase().replace(/'/g, "’"));
    // Strong words add up; soft contrasts ("but", "though") count once, so a long summary full of them doesn't top the list.
    const strong = found.filter(word => (w.get(word) ?? 1) > 1);
    return { words: [...new Set(found)], score: strong.reduce((s, word) => s + w.get(word)!, 0) + (found.length > strong.length ? 1 : 0) };
  };
  const doubt = hits(DOUBT_RE, DOUBT_W), praise = hits(PRAISE_RE, PRAISE_W);
  if (sentiment === "positive") return doubt.score ? { score: doubt.score, words: doubt.words, suggest: "mixed" } : { score: 0, words: [], suggest: null };
  // Negative: praise counts only beyond the complaints around it ("I loved it until it broke" stays negative).
  const score = praise.score - doubt.score;
  return score > 0 ? { score, words: praise.words, suggest: score >= 4 ? "positive" : "mixed" } : { score: 0, words: [], suggest: null };
}
