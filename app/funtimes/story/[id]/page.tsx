// Admin story editor (PadelRecs, owner 2026-11-22): any story in the members' editor (admin mode: title, text, topic, tagged
// rackets, featured), saved through /api/funtimes/stories/edit, with the story's kept versions under it. Admins only (checked
// here and again on save). A page of its own with the site's look, since the site stylesheet restyles any page it is on.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../thread/thread.css";
import { Shell } from "../../../thread/shell";
import { isAdmin } from "../../auth";
import { database } from "../../../../db/data";
import { adminStories } from "../../../../db/stories";
import { storyExtras, storyFeatures } from "../../../../db/story-extras";
import { revisionsOn, storyRevisions } from "../../../../db/story-revisions";
import { threadRows } from "../../../thread/data";
import { StoryComposer } from "../../../thread/live/story-composer";
import { storiesSite } from "../../../../lib/thread/sites";
import { niche } from "../../../../lib/niche";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: `Edit story | Admin | ${niche.site.name}` }, robots: { index: false, follow: false } };
const FONTS = ["https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Atkinson+Hyperlegible:wght@400;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"];

export default async function AdminStory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!storiesSite(niche.id) || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  if (!(await isAdmin())) return <main className="narrow"><h1>Edit story</h1><p>Sign in with the owner account first. <a href="/funtimes/login">Admin sign-in</a></p></main>;
  const db = await database();
  const story = (await adminStories(db, "all", 1000)).find(x => x.id === id);
  if (!story) notFound();
  const [f, { all }, kept, history] = await Promise.all([storyFeatures(db), threadRows(), revisionsOn(db), storyRevisions(db, id)]);
  const extra = (await storyExtras(db, [story], f)).get(id);
  const rackets = all.filter(r => r.current !== false || story.rackets.includes(r.id)).map(r => ({ id: r.id, name: r.name })).sort((a, b) => a.name.localeCompare(b.name));
  return <>
    {FONTS.map(href => <link key={href} rel="stylesheet" href={href} precedence="default"/>)}
    <Shell active="stories"><main className="th-main"><div className="th-col">
      <div className="th-crumbs"><a href="/funtimes?tab=stories&status=all">Stories admin</a><span>/</span><span>{story.title}</span>
        {story.status === "approved" && <><span>·</span><a href={`/stories/${story.slug}`}>Live page</a></>}</div>
      {story.pendingEdit && <p className="th-ok" role="status">{`${story.author.name} has an edit waiting (${story.pendingEdit.at.slice(0, 10)}). Saving here changes the live text; the waiting edit stays for you to approve or turn down in the admin tab.`}</p>}
      <StoryComposer rackets={rackets} topics={f.topics} admin={{ id: story.id, slug: story.slug, status: story.status, title: story.title, body: story.body,
        rackets: story.rackets, topic: extra?.topic ?? null, featured: !!extra?.featured }}/>
      <section className="th-card th-sec"><h2 className="th-h2">History</h2>
        {!kept ? <p className="th-sub">Old versions are kept once migration 0037 (story_revisions) is run. Until then each save logs the replaced text on the server.</p>
          : history.length === 0 ? <p className="th-sub">No earlier versions yet.</p>
          : history.map(h => <details key={h.id}><summary>{`${h.at.slice(0, 16).replace("T", " ")} · replaced by an ${h.by} edit · ${h.title}`}</summary>
            <p style={{ whiteSpace: "pre-wrap" }}>{h.body}</p><p className="th-sub">{`${h.rackets.length} rackets${h.topic ? ` · topic ${h.topic}` : ""}`}</p></details>)}
      </section>
    </div></main></Shell>
  </>;
}
