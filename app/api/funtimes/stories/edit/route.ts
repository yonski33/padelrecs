// Admin story edit (PadelRecs, owner 2026-11-22): any story's title, text, topic, racket tags and featured flag, from the
// admin Stories tab's editor (the members' editor in admin mode). Same admin and origin checks as every admin write
// (app/funtimes/auth.ts), checked here on the server; the member rules for the text (lib/thread/stories.ts). The edit is live
// at once, the old version is kept (db/story-revisions.ts) and the change is logged. Only this story's page and /stories are
// refreshed on demand; ISR times stay as they are.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { database, catalog } from "../../../../../db/data";
import { adminEditStory } from "../../../../../db/story-revisions";
import { adminWriteGuard } from "../../../../funtimes/auth";
import { getCurrentUser } from "../../../../../lib/supabase/auth";
import { storiesSite } from "../../../../../lib/thread/sites";
import { STORY_BODY, STORY_TITLE, STORY_RACKETS_MAX, STORY_TOPICS } from "../../../../../lib/thread/stories";
import { niche } from "../../../../../lib/niche";

const input = z.object({ id: z.string().uuid(), title: z.string().max(STORY_TITLE.max + 50), body: z.string().max(STORY_BODY.max + 500),
  rackets: z.array(z.string().max(80)).max(STORY_RACKETS_MAX), topic: z.enum(STORY_TOPICS.map(t => t[0]) as [string, ...string[]]).nullable().optional(),
  featured: z.boolean().optional() });
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** The story's own pages: the public address and the Thread page proxy.ts serves it from, and the list. */
function storyPaths(slug: string) { return [`/stories/${slug}`, `/thread/stories/${slug}`, "/stories", "/thread/stories"]; }

export async function POST(request: Request) {
  if (!storiesSite(niche.id)) return json({ error: "Not here." }, 404);
  const forbidden = await adminWriteGuard(request, "application/json"); if (forbidden) return forbidden;
  let raw: unknown; try { raw = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const parsed = input.safeParse(raw);
  if (!parsed.success) return json({ error: "Check the title and the story." }, 400);
  const v = parsed.data;
  try {
    const [db, user] = await Promise.all([database(), getCurrentUser()]);
    const listed = new Set((await catalog()).listed.map(r => r.id));
    const r = await adminEditStory(db, { id: v.id, title: v.title, body: v.body, rackets: v.rackets.filter(id => listed.has(id)),
      topic: v.topic as Parameters<typeof adminEditStory>[1]["topic"], featured: v.featured, editorId: user?.id ?? "admin" });
    if (r.status === "invalid") return json({ error: r.problem }, 400);
    if (r.status === "missing") return json({ error: "That story is gone." }, 404);
    try { for (const p of storyPaths(r.slug)) revalidatePath(p); } catch { /* outside a request */ }
    return json({ status: "saved", slug: r.slug, live: r.live, kept: r.kept });
  } catch (error) { console.error("Admin story edit failed", error); return json({ error: "Could not save that. Try again?" }, 500); }
}
