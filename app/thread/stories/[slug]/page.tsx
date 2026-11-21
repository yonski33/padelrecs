// One member story (PadelRecs pilot, owner 2026-11-20), Story v3 (owner design 2026-11-21, design_handoff_padelrecs_v3):
// Stories / topic, the story card (topic, title, author line, the text with big-numeral points, △ Helpful · Share · comments ↓
// · ⋯), the v7b Discussion as "Comments" (the author's own get an Author tag), More stories as cards, and a sidebar: author
// card, the rackets it tags with loved / mixed / not for me counts (no score), more from the author, Got a story too?.
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Shell } from "../../shell";
import { threadStory, threadMovedStory, threadStories, threadStoryExtras, threadStoryFeatures, threadAuthorStats, threadAuthorStories } from "../../stories-data";
import { threadRows } from "../../data";
import { plural, type ThreadRow } from "../../ui";
import { Discussion } from "../../live/discussion";
import { MemberMark } from "../../live/member-mark";
import { JsonLd, crumbs, base } from "../../seo";
import { th } from "../../../../lib/thread/look";
import { storyDescription, readMinutes, topicLabel } from "../../../../lib/thread/stories";
import { avatarOf } from "../../../../lib/thread/avatar";
import { StoryBody } from "../../story-body";
import { StoryActions } from "../../live/stories-v2";
import { profileLine } from "../../../../lib/thread/display-name";
import { niche } from "../../../../lib/niche";

export const revalidate = 3600;
type P = { params: Promise<{ slug: string }> };
const day = (at: string) => new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const first = (name: string) => name.trim().split(/\s+/)[0] || name;

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await threadStory((await params).slug);
  if (!s) return { title: "Story not found", robots: { index: false } };
  const url = `/stories/${s.slug}`, description = storyDescription(s.body);
  return { title: { absolute: `${s.title} | ${niche.site.name}` }, description, alternates: { canonical: url },
    openGraph: { title: s.title, description, url, type: "article", publishedTime: s.at, modifiedTime: s.updatedAt, authors: [s.author.name] } };
}

/** "31 loved · 12 mixed · 6 not for me": raw counts only (owner rule v3: no 0-100 score, no %). */
const feel = (r: ThreadRow) => [[r.pos, "loved"], [r.mix, "mixed"], [r.neg, "not for me"]].filter(([n]) => (n as number) > 0).map(([n, w]) => `${n} ${w}`).join(" · ");
function RacketLine({ r }: { r: ThreadRow }) {
  const total = r.pos + r.mix + r.neg;
  return <a className="ths3-rk" href={th(r.href)}><span className="name">{r.name}</span>
    {total > 0 ? <><span className="bar" aria-hidden="true"><i className="pos" style={{ flex: r.pos }}/><i className="mix" style={{ flex: r.mix }}/><i className="neg" style={{ flex: r.neg }}/></span>
      <small>{feel(r)}</small></> : <small>No reviews yet</small>}</a>;
}

export default async function ThreadStoryPage({ params }: P) {
  const { slug } = await params, s = await threadStory(slug);
  if (!s) {
    // A previous address (clean slugs, owner 2026-11-20): a permanent redirect to the story's current one.
    const to = await threadMovedStory(slug);
    if (to) permanentRedirect(`/stories/${to}`);
    notFound();
  }
  const [{ rows }, f, latest, stats, mine] = await Promise.all([threadRows(), threadStoryFeatures(), threadStories(), threadAuthorStats(s.id), threadAuthorStories(s.id)]);
  const more = latest.filter(x => x.id !== s.id && x.author.name !== s.author.name).slice(0, 3), byAuthor = mine.slice(0, 3);
  const extras = await threadStoryExtras([s, ...more, ...byAuthor]), x = extras.get(s.id);
  const tagged = s.rackets.map(id => rows.get(id)).filter((r): r is ThreadRow => !!r);
  const who = profileLine(s.author.level, s.author.side), av = avatarOf(s.author.name), topic = topicLabel(x?.topic), read = readMinutes(s.body);
  const ld = { "@context": "https://schema.org", "@graph": [
    crumbs([{ name: "Home", path: "/" }, { name: "Stories", path: "/stories" }, { name: s.title, path: `/stories/${s.slug}` }]),
    { "@type": "BlogPosting", headline: s.title, description: storyDescription(s.body), datePublished: s.at, dateModified: s.updatedAt,
      author: { "@type": "Person", name: s.author.name }, mainEntityOfPage: `${base()}/stories/${s.slug}`, publisher: { "@type": "Organization", name: niche.site.name } },
  ] };
  const counts = [plural(Math.max(stats.stories, 1), "story", "stories"), ...(stats.reviews > 0 ? [plural(stats.reviews, "review")] : [])].join(" · ");
  const topicOf = (id: string) => topicLabel(extras.get(id)?.topic);
  return <Shell active="stories">
    <JsonLd data={ld}/>
    <main className="th-main ths3">
      <div className="th-crumbs"><a href={th("/stories")}>Stories</a>{topic && <><span>/</span><span>{topic}</span></>}</div>
      <div className="ths3-grid">
        <div className="ths3-main">
          <article id="story" className="th-card ths3-post">
            <header className="ths3-post-head">
              {topic && <span className="ths3-topic lg">{topic}</span>}
              <h1 className="th-h1">{s.title}</h1>
              <span className="by"><span className="th7-av" style={{ background: av.bg }} aria-hidden="true">{av.init}</span><strong>{s.author.name}</strong><MemberMark/>
                <span>{[who, day(s.at), `${read} min read`, s.editedAt ? `edited ${day(s.editedAt)}` : null].filter(Boolean).map(t => ` · ${t}`).join("")}</span></span>
            </header>
            <StoryBody body={s.body} points/>
            <StoryActions id={s.id} slug={s.slug} likes={x?.likes ?? 0} comments={x?.comments ?? 0} likesOn={f.likes} featured={!!x?.featured} canFeature={f.topics}/>
          </article>
          <Discussion page={`story:${s.slug}`} model={s.title} words={{ heading: x?.comments ? `Comments (${x.comments})` : "Comments", sub: `Been through something similar? Share it with ${first(s.author.name)}.`,
            ask: "Add a comment...", askIcon: "+", placeholder: `What did you think of ${first(s.author.name)}'s story?`, empty: "No comments yet. Start it off.", author: s.author.name }}/>
          {more.length > 0 && <section className="ths3-more-wrap"><h2 className="th-h2">More stories</h2>
            <div className="ths3-cards">{more.map(m => <a key={m.id} className="th-card ths3-card" href={th(`/stories/${m.slug}`)}>
              {topicOf(m.id) && <span className="ths3-topic">{topicOf(m.id)}</span>}<strong>{m.title}</strong><small>{`${m.author.name} · ${readMinutes(m.body)} min read`}</small></a>)}</div>
          </section>}
        </div>
        <aside className="ths3-side sticky">
          <section className="th-card ths3-box">
            <span className="ths3-author"><span className="th7-av xl" style={{ background: av.bg }} aria-hidden="true">{av.init}</span>
              <span><strong>{s.author.name}</strong><small>{counts}</small></span></span>
            {who && <p>{who}</p>}
          </section>
          {tagged.length > 0 && <section className="th-card ths3-box"><h3>{tagged.length === 1 ? "Racket in this story" : "Rackets in this story"}</h3>
            {tagged.map(r => <RacketLine key={r.id} r={r}/>)}</section>}
          {byAuthor.length > 0 && <section className="th-card ths3-box"><h3>{`More from ${s.author.name}`}</h3>
            {byAuthor.map(b => { const n = extras.get(b.id)?.likes ?? 0;
              return <a key={b.id} className="ths3-pop plain" href={th(`/stories/${b.slug}`)}><span><b>{b.title}</b><small>{`${day(b.at)}${f.likes ? ` · △ ${n}` : ""}`}</small></span></a>; })}
          </section>}
          <section className="th-card ths3-box">
            <h3>Got a story too?</h3>
            <p>A few paragraphs about your racket, your game or your comeback.</p>
            <a className="ths3-btn" href={th("/stories/new")}>Share your story</a>
          </section>
        </aside>
      </div>
    </main>
  </Shell>;
}
