import { plainSummary } from "./plain-summary";

// The Reddit cards on a v11c product page (owner 2026-11-18): up to 5 per product, each our own short summary of what that
// comment says about the product, never the commenter's words. Why: the stored excerpt is only a 10–40-word span the sweep
// copied out of the comment (research-agent MAX_EXCERPT_WORDS), so a card quoting it stopped before the verdict ("…Got a Philo
// Duo Wraith." without "now that it's broken in, same distance"); the summary was written from the whole comment. Pure, so
// the dry run (scripts/reddit-card-summaries.mts) and tests see exactly what the page shows.

export type RedditRow = { id: string; racketId: string; sourcePlatform: string; sourceUrl: string; sourceName: string; sourceDate: string | null;
  summary: string | null; sentiment: "positive" | "mixed" | "negative" | null; tags?: string[] | null };

/** About one or two sentences (owner: ≤ about 200 characters). */
export const CARD_MAX = 200;
const MIN = 40, PER_PRODUCT = 5;
const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(x => x.trim()).filter(Boolean);
const end = (t: string) => /[.!?]$/.test(t) ? t : `${t}.`;

/** A stored summary as a card line: no markdown, no "Reviewer says", no quotation marks (the words are ours), then whole
 *  sentences up to CARD_MAX. Null when even its first sentence is longer, or it is too short to say anything. */
export function cardLine(summary?: string | null): string | null {
  if (!summary) return null;
  const t = plainSummary(summary.replace(/\*\*|__/g, "").replace(/["“”]/g, "").replace(/\s+/g, " ").trim());
  let out = "";
  for (const s of sentences(t)) { const next = out ? `${out} ${s}` : s; if (next.length > CARD_MAX) break; out = next; }
  out = out && end(out);
  return out.length >= MIN ? out : null;
}

/** A line that tells the commenter's story or who they are before what the product does ("After demoing several rackets, a
 *  player bought…", "A self-described noodle arm who…"). The picker shows these only when a product has no other line. */
export const BACKSTORY = /^(a self-described|this (player|reviewer|user)|a (player|user|reviewer|commenter)|after |lost |switched |struggled |moved |started |went |coming from |came from |as a )/i;

/** "r/discgolf" from the thread link, else the stored source name. */
export const subOf = (url: string, name: string) => url.match(/reddit\.com\/(r\/[A-Za-z0-9_]+)/)?.[1] ?? name;

/** This product's Reddit cards: rows with a card line, verdict-first lines before backstory ones, newest first. Variety
 *  first (the newest loved, mixed and nope one where there is one), then the rest in that order; at most 5. */
export function redditPick<T extends RedditRow>(rows: T[], racketId: string): { row: T; text: string }[] {
  const ok = rows.filter(e => e.racketId === racketId && e.sourcePlatform === "Reddit")
    .map(row => ({ row, text: cardLine(row.summary) })).filter((x): x is { row: T; text: string } => !!x.text)
    .sort((a, b) => Number(BACKSTORY.test(a.text)) - Number(BACKSTORY.test(b.text)) || (b.row.sourceDate ?? "").localeCompare(a.row.sourceDate ?? ""));
  const pick = (["positive", "mixed", "negative"] as const).flatMap(v => ok.filter(x => x.row.sentiment === v).slice(0, 1));
  for (const x of ok) { if (pick.length >= PER_PRODUCT) break; if (!pick.includes(x)) pick.push(x); }
  return pick.slice(0, PER_PRODUCT);
}
