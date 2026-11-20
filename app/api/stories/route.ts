// Member stories (PadelRecs only, drizzle/0031). POST {title, body, rackets[]} saves a signed-in member's story: the owner's
// goes live at once, everyone else's waits in the admin Stories tab (spam is rejected). GET ?token=1 hands out a form token.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { database, catalog } from "../../../db/data";
import { addStory, editStory, deleteStory, storyForEditor, myStories, setStoryStatus } from "../../../db/stories";
import { setStoryTopic, storyFeatures, storyTopic } from "../../../db/story-extras";
import { currentPlayer } from "../../../lib/thread/account-session";
import { allowedAdmin } from "../../../lib/admin-access";
import { storiesSite } from "../../../lib/thread/sites";
import { STORY_BODY, STORY_TITLE, STORY_RACKETS_MAX, STORY_TOPICS, type StoryTopic } from "../../../lib/thread/stories";
import { issueFormToken, checkFormToken, tokenRejects } from "../../../lib/form-token";
import { createLimiter, clientIp } from "../../../lib/rate-limit";
import { niche } from "../../../lib/niche";
import { network, json, foreign } from "../thread-device";

const off = () => !storiesSite(niche.id) || !process.env.DATABASE_URL;
const burst = createLimiter({ limit: 6, windowMs: 60 * 60_000 });
const body = z.object({ title: z.string().trim().min(1).max(STORY_TITLE.max + 20), body: z.string().trim().min(1).max(STORY_BODY.max + 200),
  rackets: z.array(z.string().max(100)).max(STORY_RACKETS_MAX).default([]), formToken: z.string().optional(), website: z.string().optional(),
  /** The story's topic (drizzle/0033); ignored until that migration is in. null clears it. */
  topic: z.enum(STORY_TOPICS.map(t => t[0]) as [StoryTopic, ...StoryTopic[]]).nullable().optional() });

const edit = z.object({ id: z.string().uuid(), title: body.shape.title, body: body.shape.body, rackets: body.shape.rackets, topic: body.shape.topic, formToken: z.string().optional() });
/** An admin hides a live story from its page's ⋯ menu (owner design 2026-11-21): it goes to the Stories tab's Rejected list. */
const hide = z.object({ id: z.string().uuid(), hide: z.literal(true) });
/** The topic is plain metadata, saved at once (not part of a waiting edit); skipped before drizzle/0033. */
async function saveTopic(db: Awaited<ReturnType<typeof database>>, id: string, topic: StoryTopic | null | undefined) {
  if (topic === undefined) return;
  try { if ((await storyFeatures(db)).topics) await setStoryTopic(db, id, topic); } catch (error) { console.error("Story topic failed", error); }
}

/** The signed-in member, and whether they may change this story: its author, or an admin (owner 2026-11-20). */
async function editor(db: Awaited<ReturnType<typeof database>>) {
  const me = await currentPlayer(db);
  return me ? { me, admin: allowedAdmin(me.user.id, process.env.ADMIN_USER_IDS) } : null;
}
const refresh = () => { try { revalidatePath("/", "layout"); } catch { /* outside a request */ } };

// GET ?token=1 a form token; ?edit=<slug> the story to edit (its author or an admin; a waiting edit's text if there is one);
// ?can=<slug> whether this visitor may edit it (the story page's Edit link); ?mine=1 the member's own stories.
export async function GET(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  const q = new URL(request.url).searchParams;
  if (q.get("token")) return json({ token: issueFormToken() });
  const slug = q.get("edit") ?? q.get("can");
  if (!slug && !q.get("mine")) return json({});
  try {
    const db = await database(), who = await editor(db);
    if (q.get("mine")) return json({ stories: who?.me.account ? (await myStories(db, who.me.account.id)).map(s => ({ id: s.id, slug: s.slug, title: s.title, status: s.status, at: s.at, editedAt: s.editedAt, editWaiting: s.editWaiting })) : [] });
    const s = slug ? await storyForEditor(db, slug) : null;
    const may = !!s && !!who && (who.admin || who.me.account?.id === s.accountId);
    if (q.get("can")) return json({ canEdit: may, admin: !!who?.admin });
    if (!s || !may) return json({ error: "Only its author can edit this story." }, 403);
    const p = s.pendingEdit, f = await storyFeatures(db).catch(() => ({ topics: false }));
    return json({ story: { id: s.id, slug: s.slug, title: p?.title ?? s.title, body: p?.body ?? s.body, rackets: p?.rackets ?? s.rackets, status: s.status, editWaiting: !!p,
      topic: f.topics ? await storyTopic(db, s.id) : null }, token: issueFormToken() });
  } catch (error) { console.error("Story read failed", error); return json({ error: "Could not load that story." }, 500); }
}

/** Save an edit: an admin's goes live at once; a member's edit to a live story waits for a check while the old text stays. */
export async function PATCH(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Edit from the story page, please." }, 403);
  if (!burst.hit(clientIp(request))) return json({ error: "Too many changes. Try again later." }, 429);
  let raw: unknown; try { raw = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const hiding = hide.safeParse(raw);
  if (hiding.success) {
    try {
      const db = await database(), who = await editor(db);
      if (!who?.admin) return json({ error: "Only the owner can hide stories." }, 403);
      if (!(await setStoryStatus(db, hiding.data.id, "rejected"))) return json({ error: "That story is gone." }, 404);
      refresh(); return json({ status: "hidden" });
    } catch (error) { console.error("Story hide failed", error); return json({ error: "Could not hide that. Try again?" }, 500); }
  }
  const parsed = edit.safeParse(raw);
  if (!parsed.success) return json({ error: "Check the title and the story." }, 400);
  const v = parsed.data;
  try {
    const db = await database(), who = await editor(db);
    if (!who) return json({ error: "Sign in to edit your story." }, 401);
    const current = await db.query.stories.findFirst({ where: (t, { eq }) => eq(t.id, v.id), columns: { accountId: true } });
    if (!current) return json({ error: "That story is gone." }, 404);
    if (!who.admin && who.me.account?.id !== current.accountId) return json({ error: "Only its author can edit this story." }, 403);
    const listed = new Set((await catalog()).listed.map(r => r.id)), rackets = v.rackets.filter(id => listed.has(id));
    // Trusted members (#537) can join `live` here once it is merged.
    const r = await editStory(db, { id: v.id, title: v.title, body: v.body, rackets, live: who.admin });
    if (r.status === "invalid") return json({ error: r.problem }, 400);
    if (r.status === "missing") return json({ error: "That story is gone." }, 404);
    await saveTopic(db, v.id, v.topic);
    if (r.status === "live") refresh();
    return json({ status: r.status, slug: r.slug });
  } catch (error) { console.error("Story edit failed", error); return json({ error: "Could not save that. Try again?" }, 500); }
}

/** Delete a story and its comments: its author or an admin. */
export async function DELETE(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Delete from the story page, please." }, 403);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!z.string().uuid().safeParse(id).success) return json({ error: "Which story?" }, 400);
  try {
    const db = await database(), who = await editor(db);
    if (!who) return json({ error: "Sign in first." }, 401);
    const current = await db.query.stories.findFirst({ where: (t, { eq }) => eq(t.id, id), columns: { accountId: true } });
    if (!current) return json({ error: "That story is gone." }, 404);
    if (!who.admin && who.me.account?.id !== current.accountId) return json({ error: "Only its author can delete this story." }, 403);
    await deleteStory(db, id); refresh();
    return json({ status: "deleted" });
  } catch (error) { console.error("Story delete failed", error); return json({ error: "Could not delete that. Try again?" }, 500); }
}

export async function POST(request: Request) {
  if (off()) return json({ error: "Not here." }, 404);
  if (foreign(request)) return json({ error: "Post from the story page, please." }, 403);
  if (!burst.hit(clientIp(request))) return json({ error: "Too many posts. Try again later." }, 429);
  let parsed; try { parsed = body.safeParse(await request.json()); } catch { return json({ error: "Invalid request." }, 400); }
  if (!parsed.success) return json({ error: "Check the title and the story." }, 400);
  const v = parsed.data;
  if (v.website) return json({ status: "pending" }); // honeypot
  const token = checkFormToken(v.formToken); if (tokenRejects(token)) return json({ error: "The form expired. Reload the page and try again." }, 400);
  try {
    const db = await database(), me = await currentPlayer(db);
    if (!me) return json({ error: "Sign in to post a story." }, 401);
    if (!me.account) return json({ error: "Pick your name on the account page first." }, 403);
    if (me.account.status !== "active") return json({ error: "This account can't post." }, 403);
    // Racket tags: only listed rackets, by id.
    const listed = new Set((await catalog()).listed.map(r => r.id)), rackets = v.rackets.filter(id => listed.has(id));
    // The owner (an admin user) posts straight away; trusted members (#537) can join this once it is merged.
    const live = allowedAdmin(me.user.id, process.env.ADMIN_USER_IDS);
    const r = await addStory(db, { accountId: me.account.id, title: v.title, body: v.body, rackets, network: network(request), live });
    if (r.status === "invalid") return json({ error: r.problem }, 400);
    if (r.status === "limited") return json({ error: "That's a lot of stories for one day. Try again tomorrow." }, 429);
    if (r.status !== "rejected") await saveTopic(db, r.id, v.topic);
    if (r.status === "approved") { try { revalidatePath("/", "layout"); } catch { /* outside a request */ } }
    return json({ status: r.status === "approved" ? "live" : r.status === "rejected" ? "rejected" : "pending", ...(r.status === "approved" ? { slug: r.slug } : {}) });
  } catch (error) { console.error("Story post failed", error); return json({ error: "Could not post that. Try again?" }, 500); }
}
