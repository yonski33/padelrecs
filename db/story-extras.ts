// What the Stories redesign (owner design 2026-11-21) adds to a story: its topic and ▲ likes (drizzle/0033), and its comment
// count. Plain SQL so the pages work before 0033 is run: each read falls back to "off" (no topic tabs, no ▲) when the column
// or table isn't there yet, and comment counts work either way.
import { sql } from "drizzle-orm";
import type { getDb } from "./index";
import { assertSchemaName } from "./migrations";
import { niche } from "../lib/niche";
import { isStoryTopic, type StoryTopic } from "../lib/thread/stories";

type Database = ReturnType<typeof getDb>;
const T = () => sql.identifier(assertSchemaName(niche.schema));
const rowsOf = <R>(res: unknown): R[] => (res as { rows?: R[] }).rows ?? (res as R[]);

export type StoryFeatures = { topics: boolean; likes: boolean };
/** Whether 0033 is in: the topic column and the likes table. */
export async function storyFeatures(db: Database): Promise<StoryFeatures> {
  const [r] = rowsOf<{ topic: boolean; likes: boolean }>(await db.execute(sql`select
    exists (select 1 from information_schema.columns where table_schema = ${niche.schema} and table_name = 'stories' and column_name = 'topic') as topic,
    to_regclass(${`${niche.schema}.story_likes`}) is not null as likes`));
  return { topics: !!r?.topic, likes: !!r?.likes };
}

export type StoryExtra = { topic: StoryTopic | null; likes: number; comments: number };
/** Topic, ▲ count and shown comments for each story (by id). */
export async function storyExtras(db: Database, list: { id: string; slug: string }[], f: StoryFeatures): Promise<Map<string, StoryExtra>> {
  const out = new Map(list.map(s => [s.id, { topic: null, likes: 0, comments: 0 } as StoryExtra]));
  if (!list.length) return out;
  const ids = list.map(s => s.id), pages = list.map(s => `story:${s.slug}`), bySlug = new Map(list.map(s => [`story:${s.slug}`, s.id]));
  const cm = rowsOf<{ page: string; n: number }>(await db.execute(sql`select page, count(*)::int as n from ${T()}.comments
    where status = 'approved' and page in (${sql.join(pages.map(p => sql`${p}`), sql`, `)}) group by page`));
  for (const r of cm) { const id = bySlug.get(r.page); if (id) out.get(id)!.comments = Number(r.n); }
  const inIds = sql.join(ids.map(i => sql`${i}`), sql`, `);
  if (f.topics) for (const r of rowsOf<{ id: string; topic: string | null }>(await db.execute(sql`select id, topic from ${T()}.stories where id in (${inIds})`)))
    if (isStoryTopic(r.topic)) out.get(r.id)!.topic = r.topic;
  if (f.likes) for (const r of rowsOf<{ id: string; n: number }>(await db.execute(sql`select story_id as id, count(*)::int as n from ${T()}.story_likes where story_id in (${inIds}) group by story_id`)))
    out.get(r.id)!.likes = Number(r.n);
  return out;
}

/** The most liked live stories over the last 30 days (the list's sidebar), by likes given in that time. */
export async function likedThisMonth(db: Database, limit = 4, now = new Date()) {
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  return rowsOf<{ id: string; n: number }>(await db.execute(sql`select l.story_id as id, count(*)::int as n from ${T()}.story_likes l
    join ${T()}.stories s on s.id = l.story_id where s.status = 'approved' and l.created_at >= ${since}
    group by l.story_id order by n desc, max(l.created_at) desc limit ${limit}`)).map(r => ({ id: r.id, likes: Number(r.n) }));
}

/** The author's live stories and the ▲ they got, for the story page's author card. */
export async function authorStats(db: Database, storyId: string, f: StoryFeatures) {
  const [r] = rowsOf<{ stories: number; likes: number }>(await db.execute(sql`select count(*)::int as stories,
    ${f.likes ? sql`(select count(*)::int from ${T()}.story_likes l join ${T()}.stories x on x.id = l.story_id where x.account_id = s0.account_id and x.status = 'approved')` : sql`0`} as likes
    from ${T()}.stories s join ${T()}.stories s0 on s0.id = ${storyId} where s.account_id = s0.account_id and s.status = 'approved' group by s0.account_id`));
  return { stories: Number(r?.stories ?? 0), likes: Number(r?.likes ?? 0) };
}

/** Set or clear a story's topic (after 0033). */
export async function setStoryTopic(db: Database, id: string, topic: StoryTopic | null) {
  await db.execute(sql`update ${T()}.stories set topic = ${topic} where id = ${id}`);
}
/** The topic a story has now (the edit form). */
export async function storyTopic(db: Database, id: string): Promise<StoryTopic | null> {
  const [r] = rowsOf<{ topic: string | null }>(await db.execute(sql`select topic from ${T()}.stories where id = ${id}`));
  return isStoryTopic(r?.topic) ? r.topic : null;
}

/** ▲ a story, or take it back. Only live stories. Returns false when the story isn't live. */
export async function likeStory(db: Database, storyId: string, accountId: string, on: boolean, now = new Date()) {
  const [live] = rowsOf<{ ok: number }>(await db.execute(sql`select 1 as ok from ${T()}.stories where id = ${storyId} and status = 'approved'`));
  if (!live) return false;
  if (on) await db.execute(sql`insert into ${T()}.story_likes (story_id, account_id, created_at) values (${storyId}, ${accountId}, ${now.toISOString()}) on conflict do nothing`);
  else await db.execute(sql`delete from ${T()}.story_likes where story_id = ${storyId} and account_id = ${accountId}`);
  return true;
}
/** Which stories this account has ▲'d (so the cached pages can show the arrow as theirs). */
export async function likedBy(db: Database, accountId: string) {
  return rowsOf<{ id: string }>(await db.execute(sql`select story_id as id from ${T()}.story_likes where account_id = ${accountId} order by created_at desc limit 500`)).map(r => r.id);
}
