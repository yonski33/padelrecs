// Clean story slugs (owner 2026-11-20): give each story the address its title makes (no id suffix), keeping the old one in
// old_slugs (it 301s) and moving its comments (page "story:<slug>"). Needs migration 0032. Dry run by default; --write applies.
//   NICHE=padel npx tsx --conditions=react-server --env-file=.env.local scripts/move-story-slugs.mts [--write]
import { getDb } from "../db/index";
import { stories, comments } from "../db/schema";
import { moveStory } from "../db/stories";
import { storySlug, freeSlug } from "../lib/thread/stories";
import { eq, count } from "drizzle-orm";
import { niche } from "../lib/niche";

if (niche.id !== "padel") throw new Error("Stories are a PadelRecs pilot: run with NICHE=padel.");
const write = process.argv.includes("--write"), db = await getDb();
const all = await db.select({ id: stories.id, slug: stories.slug, title: stories.title, old: stories.oldSlugs, status: stories.status }).from(stories);
const taken = new Set(all.flatMap(s => [s.slug, ...(s.old ?? [])]));
for (const s of all) {
  const base = storySlug(s.title);
  if (s.slug === base || s.slug.replace(/-\d+$/, "") === base) { console.log(`ok      ${s.slug}`); continue; }
  taken.delete(s.slug);
  const to = freeSlug(base, taken); taken.add(to); taken.add(s.slug);
  const [c] = await db.select({ n: count() }).from(comments).where(eq(comments.page, `story:${s.slug}`));
  console.log(`${write ? "move" : "would move"}  ${s.status}  /stories/${s.slug}  ->  /stories/${to}  (${Number(c.n)} comments)`);
  if (write) console.log("   ", JSON.stringify(await moveStory(db, s.id, to)));
}
process.exit(0);
