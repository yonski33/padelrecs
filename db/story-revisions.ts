// Admin story edits (PadelRecs, owner 2026-11-22): the owner changes any story's title, text, topic, racket tags and featured
// flag from the admin Stories tab. The text goes live at once (no waiting edit, no spam hold), and the version it replaces is
// kept in story_revisions (drizzle/0037), marked as an admin edit. Plain SQL so the tab works before 0037 is run: without the
// table the edit still saves, the old text goes to the server log instead, and the editor says history starts after 0037.
import { randomUUID } from "node:crypto";
import { sql, eq } from "drizzle-orm";
import type { getDb } from "./index";
import { stories } from "./schema";
import { assertSchemaName } from "./migrations";
import { niche } from "../lib/niche";
import { storyProblem, isStoryTopic, type StoryTopic } from "../lib/thread/stories";
import { storyFeatures, setStoryTopic, setStoryFeatured } from "./story-extras";

type Database = ReturnType<typeof getDb>;
const T = () => sql.identifier(assertSchemaName(niche.schema));
const rowsOf = <R>(res: unknown): R[] => (res as { rows?: R[] }).rows ?? (res as R[]);

/** Whether drizzle/0037 is in. */
export async function revisionsOn(db: Database) {
  const [r] = rowsOf<{ on: boolean }>(await db.execute(sql`select to_regclass(${`${niche.schema}.story_revisions`}) is not null as on`));
  return !!r?.on;
}

export type Revision = { id: string; title: string; body: string; rackets: string[]; topic: StoryTopic | null; by: "admin" | "member"; at: string };
/** A story's kept versions, newest first. */
export async function storyRevisions(db: Database, storyId: string, limit = 20): Promise<Revision[]> {
  if (!(await revisionsOn(db))) return [];
  return rowsOf<{ id: string; title: string; body: string; rackets: string[] | null; topic: string | null; edited_by: string; created_at: string }>(await db.execute(sql`select id, title, body, rackets, topic, edited_by, created_at
    from ${T()}.story_revisions where story_id = ${storyId} order by created_at desc limit ${limit}`))
    .map(r => ({ id: r.id, title: r.title, body: r.body, rackets: r.rackets ?? [], topic: isStoryTopic(r.topic) ? r.topic : null, by: r.edited_by === "member" ? "member" : "admin", at: r.created_at }));
}

export type AdminEdit = { id: string; title: string; body: string; rackets: string[]; topic?: StoryTopic | null; featured?: boolean; editorId: string };
/** Save an admin's edit: the member rules (lib/thread/stories.ts storyProblem), live at once, the old version kept. */
export async function adminEditStory(db: Database, e: AdminEdit, now = new Date()) {
  const title = e.title.trim(), body = e.body.trim(), rackets = [...new Set(e.rackets)];
  const problem = storyProblem({ title, body, rackets }); if (problem) return { status: "invalid" as const, problem };
  const [s] = await db.select({ slug: stories.slug, status: stories.status, title: stories.title, body: stories.body, rackets: stories.rackets }).from(stories).where(eq(stories.id, e.id));
  if (!s) return { status: "missing" as const };
  const f = await storyFeatures(db), at = now.toISOString();
  const oldTopic = f.topics ? rowsOf<{ topic: string | null }>(await db.execute(sql`select topic from ${T()}.stories where id = ${e.id}`))[0]?.topic ?? null : null;
  const kept = await revisionsOn(db);
  if (kept) await db.execute(sql`insert into ${T()}.story_revisions (id, story_id, title, body, rackets, topic, edited_by, editor_id, created_at)
    values (${randomUUID()}, ${e.id}, ${s.title}, ${s.body}, ${JSON.stringify(s.rackets ?? [])}::jsonb, ${oldTopic}, 'admin', ${e.editorId}, ${at})`);
  // A member's waiting edit stays waiting: the owner decides it separately (Approve edit / Turn down edit).
  await db.update(stories).set({ title, body, rackets, updatedAt: at, ...(s.status === "approved" ? { editedAt: at } : {}) }).where(eq(stories.id, e.id));
  if (f.topics && e.topic !== undefined) await setStoryTopic(db, e.id, e.topic);
  if (f.topics && e.featured !== undefined) await setStoryFeatured(db, e.id, e.featured, now);
  // The change log (owner rule: every admin change is logged), never the text itself when history keeps it.
  console.info("[admin] story edited", JSON.stringify({ id: e.id, slug: s.slug, by: e.editorId, at, kept,
    changed: { title: s.title !== title, body: s.body !== body, rackets: JSON.stringify(s.rackets ?? []) !== JSON.stringify(rackets), topic: e.topic !== undefined && e.topic !== oldTopic, featured: e.featured },
    ...(kept ? {} : { previous: { title: s.title, body: s.body, rackets: s.rackets, topic: oldTopic } }) }));
  return { status: "saved" as const, slug: s.slug, live: s.status === "approved", kept };
}
