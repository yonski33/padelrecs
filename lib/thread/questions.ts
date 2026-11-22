// PadelRecs "Latest questions from the community" and /questions (owner OK 2026-11-21): the racket pages' top-level posts that
// read as questions (lib/thread/feed.ts postFlair, the feed's own rule), each with its racket, answer count and top answer.
// Pure, so the tests see exactly what the home and the page show.
import { activity, flairFor } from "./feed";

export type QComment = { id: string; page: string; parentId: string | null; alias: string; body: string; at: string; score: number;
  /** A saved Question or Tip (drizzle/0035), or an admin's "none" (0038); absent for plain posts and older rows. */
  type?: "question" | "tip" | "none" };
export type QRacket = { id: string; name: string; href: string; pic: string | null };
export type Question = { id: string; racket: QRacket; alias: string; body: string; at: string; activity: string; answers: number;
  /** The most ▲'d answer (ties: the earliest), as "Name: first line". */ top: { alias: string; line: string } | null;
  /** The asker's level and side (members only), filled in by the loader. */ info?: string | null };

/** The section hides under this many questions site-wide. */
export const QUESTIONS_MIN = 3;
/** Unanswered questions pinned first on the home. */
export const PIN_UNANSWERED = 2;
export const HOME_QUESTIONS = 5;

/** An answer's first line, about one sentence (up to ~110 characters, cut at a word). */
export function firstLine(body: string) {
  const t = body.replace(/\s+/g, " ").trim(), s = t.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? t;
  return s.length <= 110 ? s : `${s.slice(0, s.lastIndexOf(" ", 106))}…`;
}

export function questionsOf(list: QComment[], rackets: Map<string, QRacket>): Question[] {
  const replies = new Map<string, QComment[]>();
  for (const c of list) if (c.parentId) replies.set(c.parentId, [...(replies.get(c.parentId) ?? []), c]);
  return list.flatMap(c => {
    const r = rackets.get(c.page.replace(/^racket:/, ""));
    // A saved type wins (a saved Tip is never a question); else the feed's own rule on the words.
    if (c.parentId || !r || flairFor(c.type, c.body) !== "question") return [];
    const rs = [...(replies.get(c.id) ?? [])].sort((a, b) => b.score - a.score || a.at.localeCompare(b.at));
    return [{ id: c.id, racket: r, alias: c.alias, body: c.body, at: c.at, activity: activity(c.at, rs), answers: rs.length,
      top: rs[0] ? { alias: rs[0].alias, line: firstLine(rs[0].body) } : null }];
  });
}

/** Newest activity first (a new answer bumps a question), or most answers first. */
export const sortQuestions = (qs: Question[], by: "new" | "answers" = "new") =>
  [...qs].sort((a, b) => by === "answers" ? b.answers - a.answers || b.activity.localeCompare(a.activity) : b.activity.localeCompare(a.activity));

/** The home's rows: up to PIN_UNANSWERED unanswered ones pinned first (newest first), then newest activity. */
export function homeQuestions(qs: Question[], n = HOME_QUESTIONS) {
  const pinned = sortQuestions(qs.filter(q => q.answers === 0)).slice(0, PIN_UNANSWERED), ids = new Set(pinned.map(q => q.id));
  return [...pinned, ...sortQuestions(qs).filter(q => !ids.has(q.id))].slice(0, n);
}
