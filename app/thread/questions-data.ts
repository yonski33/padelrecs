// "Latest questions from the community" and /questions (PadelRecs, owner OK 2026-11-21): the racket pages' questions, read
// once per render (the pages are ISR-cached as before). Empty without a database or off padel, and on any read error.
import { cache } from "react";
import { database } from "../../db/data";
import { racketComments } from "../../db/comments";
import { memberMap } from "../../lib/thread/member-marks";
import { reviewerInfo } from "../../lib/thread/display-name";
import { questionsOf, type Question, type QRacket } from "../../lib/thread/questions";
import { niche } from "../../lib/niche";
import { threadRows } from "./data";

export const threadQuestions = cache(async (): Promise<Question[]> => {
  if (!process.env.DATABASE_URL || niche.id !== "padel") return [];
  try {
    const db = await database(), [{ all }, list] = await Promise.all([threadRows(), racketComments(db)]);
    const rackets = new Map<string, QRacket>(all.map(r => [r.id, { id: r.id, name: r.name, href: r.href, pic: r.pic }]));
    const qs = questionsOf(list, rackets);
    // The asker's level and side, for members (the feed's grey tag); everyone else shows a name only.
    const members = await memberMap(db, "comment", qs.map(q => q.id));
    return qs.map(q => { const m = members.get(q.id); return m ? { ...q, info: reviewerInfo({ level: m.level, side: m.side }) } : q; });
  } catch (error) { console.error("[thread] questions read failed", error); return []; }
});
