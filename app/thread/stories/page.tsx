// Member stories (PadelRecs pilot, owner 2026-11-20), in the owner's design (2026-11-21, design_handoff_padel_stories): a top
// card with Share your story, topic tabs and a Sort menu over plain divided rows (avatar · name · level · time, title, two-line
// excerpt, topic · racket · ▲ · comments · read time), Load more, and a sidebar with the posting rules and the month's most liked.
// Topics and ▲ show once drizzle/0033 is in; until then the rows simply leave them out.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { threadStories, threadStoryExtras, threadStoryFeatures, threadLikedThisMonth } from "../stories-data";
import { threadRows } from "../data";
import { th } from "../../../lib/thread/look";
import { storyDescription, readMinutes } from "../../../lib/thread/stories";
import { avatarOf } from "../../../lib/thread/avatar";
import { niche } from "../../../lib/niche";
import { ago, cap } from "../ui";
import { StoryList, type StoryItem } from "../live/stories-v2";

export const revalidate = 3600;
const TITLE = "Player stories", INTRO = "Short write-ups from padel players. Racket switches, first seasons, comebacks and what actually helped.";
export const metadata: Metadata = { title: { absolute: `${TITLE} | ${niche.site.name}` }, description: INTRO, alternates: { canonical: "/stories" },
  openGraph: { title: TITLE, description: INTRO, url: "/stories", type: "website" } };

export default async function ThreadStories() {
  const [list, f, { rows }] = await Promise.all([threadStories(), threadStoryFeatures(), threadRows()]);
  const [extras, top] = await Promise.all([threadStoryExtras(list), threadLikedThisMonth()]);
  const items: StoryItem[] = list.map(s => {
    const x = extras.get(s.id), a = avatarOf(s.author.name), r = s.rackets.map(id => rows.get(id)).find(Boolean);
    return { id: s.id, slug: s.slug, title: s.title, excerpt: storyDescription(s.body), who: s.author.name, init: a.init, bg: a.bg,
      level: s.author.level?.trim() ? cap(s.author.level.trim().toLowerCase()) : null, at: s.at, ago: ago(s.at), topic: x?.topic ?? null,
      racket: r ? { name: r.name, href: r.href } : null, likes: x?.likes ?? 0, comments: x?.comments ?? 0, read: readMinutes(s.body) };
  });
  const byId = new Map(list.map(s => [s.id, s])), popular = top.map(t => ({ ...t, s: byId.get(t.id) })).filter(t => t.s);
  const hero = <div className="ths-hero-top"><div className="ths-hero-words"><h1 className="th-h1">{TITLE}</h1><p>{INTRO}</p></div>
    <a className="ths-share" href={th("/stories/new")}>+ Share your story</a></div>;
  return <Shell active="stories">
    <main className="th-main ths"><div className="th-col">
      {items.length === 0 ? <><section className="th-card ths-hero">{hero}</section>
        <section className="th-card ths-list"><p className="th-note" style={{ padding: "14px 0" }}>No stories yet. Members can write the first one.</p></section></>
        : <StoryList items={items} likesOn={f.likes} hero={hero}/>}
    </div>
    <aside className="th-side">
      <section className="th-card ths-box lime">
        <span className="ths-box-h">Share your story</span>
        <span>A few paragraphs is plenty. What changed, what helped, what you&apos;d tell your past self.</span>
        <div className="ths-rules"><span>· 150 to 600 words is plenty</span><span>· Tag the racket you play with</span><span>· No brand reps or paid posts</span></div>
        <a className="ths-box-btn" href={th("/stories/new")}>Start a story</a>
      </section>
      {popular.length > 0 && <section className="th-card ths-box">
        <span className="ths-box-h sm">Most liked this month</span>
        <ol className="ths-top">{popular.map((t, i) => <li key={t.id}><a href={th(`/stories/${t.s!.slug}`)}><span className="n">{i + 1}</span>
          <span><b>{t.s!.title}</b><small>{`${t.s!.author.name} · ▲ ${t.likes}`}</small></span></a></li>)}</ol>
      </section>}
    </aside></main>
  </Shell>;
}
