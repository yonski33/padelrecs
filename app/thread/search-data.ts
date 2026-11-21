// PadelRecs Search v3 (owner design 2026-11-21): the index the /search page filters in the browser. Built with the cached
// page (no request per search): rackets with their loved / mixed / not for me counts, the newest top-level comments with the
// page they're on and their reply count, and the live stories with the rackets they tag.
import { sql } from "drizzle-orm";
import { database } from "../../db/data";
import { assertSchemaName } from "../../db/migrations";
import { niche } from "../../lib/niche";
import { GUIDES } from "../../lib/thread/copy";
import { GUIDE_PATHS } from "../../lib/thread/look";
import { threadRows } from "./data";
import { threadRankings } from "./rankings-data";
import { threadStories } from "./stories-data";

export type SearchIndex = {
  rackets: { id: string; name: string; brand: string; shape: string | null; pic: string | null; href: string; pos: number; mix: number; neg: number; n: number }[];
  talk: { id: string; text: string; where: string; href: string; replies: number }[];
  stories: { id: string; title: string; who: string; href: string; mentions: string[] }[];
};
const rowsOf = <R>(res: unknown): R[] => (res as { rows?: R[] }).rows ?? (res as R[]);
const COMMENTS = 400;

export async function searchIndex(): Promise<SearchIndex> {
  const [{ all, rows }, lists, stories] = await Promise.all([threadRows(), threadRankings(), threadStories()]);
  const rackets = all.filter(r => r.current !== false).map(r => ({ id: r.id, name: r.name, brand: r.brand, shape: r.shape, pic: r.pic, href: r.href, pos: r.pos, mix: r.mix, neg: r.neg, n: r.n }));
  const story = stories.map(s => ({ id: s.id, title: s.title, who: s.author.name, href: `/stories/${s.slug}`, mentions: s.rackets.map(id => rows.get(id)?.name).filter((x): x is string => !!x) }));
  let talk: SearchIndex["talk"] = [];
  if (process.env.DATABASE_URL) try {
    const T = sql.identifier(assertSchemaName(niche.schema));
    const list = rowsOf<{ id: string; page: string; body: string; replies: number }>(await (await database()).execute(sql`select c.id, c.page, c.body,
      (select count(*)::int from ${T}.comments r where r.parent_id = c.id and r.status = 'approved') as replies
      from ${T}.comments c where c.status = 'approved' and c.parent_id is null order by c.created_at desc limit ${COMMENTS}`));
    const bySlug = new Map(all.map(r => [r.id, r])), ranking = new Map(lists.map(l => [l.slug, l])), storyBy = new Map(stories.map(s => [s.slug, s]));
    talk = list.flatMap(c => {
      const [kind, key] = [c.page.slice(0, c.page.indexOf(":")), c.page.slice(c.page.indexOf(":") + 1)];
      const at = kind === "racket" ? bySlug.get(key) && { where: bySlug.get(key)!.name, href: bySlug.get(key)!.href }
        : kind === "ranking" ? ranking.get(key) && { where: ranking.get(key)!.title, href: ranking.get(key)!.href }
        : kind === "guide" ? GUIDES.find(g => g.key === key) && { where: GUIDES.find(g => g.key === key)!.title, href: GUIDE_PATHS[key as keyof typeof GUIDE_PATHS] }
        : kind === "story" ? storyBy.get(key) && { where: storyBy.get(key)!.title, href: `/stories/${key}` } : null;
      if (!at) return [];
      const text = c.body.replace(/\s+/g, " ").trim();
      return [{ id: c.id, text: text.length > 140 ? `${text.slice(0, 137).replace(/\s+\S*$/, "")}…` : text, where: at.where, href: `${at.href}#cm-${c.id}`, replies: Number(c.replies) }];
    });
  } catch (error) { console.error("[thread] search comments failed", error); }
  return { rackets, talk, stories: story };
}
