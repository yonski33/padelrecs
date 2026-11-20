// One member story (PadelRecs pilot, owner 2026-11-20), in the owner's design (2026-11-21, design_handoff_padel_stories):
// Stories / topic, the story card (author row with avatar, level · side, date · read time and the topic; the title; the text;
// "Racket in this story" cards with the Player score; ▲ · comments · Share · ⋯), the v7b Discussion as "Comments" (the
// author's own get an Author tag), More stories, and a sidebar with the author card and "Got a story too?".
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Shell } from "../../shell";
import { threadStory, threadMovedStory, threadStories, threadStoryExtras, threadStoryFeatures, threadAuthorStats } from "../../stories-data";
import { threadRows } from "../../data";
import { tone, plural, type ThreadRow } from "../../ui";
import { Discussion } from "../../live/discussion";
import { MemberMark } from "../../live/member-mark";
import { JsonLd, crumbs, base } from "../../seo";
import { th } from "../../../../lib/thread/look";
import { W } from "../../../../lib/thread/words";
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

function RacketCard({ r, label }: { r: ThreadRow; label: string }) {
  return <a className="ths-racket-card" href={th(r.href)}>
    <span className="pic">{r.pic ? <img src={r.pic} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>}</span>
    <span className="words"><small>{label}</small><strong>{r.name}</strong><span className="go">See reviews ›</span></span>
    <span className="score">{r.score != null ? <><span className={`th-badge sm ${tone(r.score)}`}>{r.score}</span><small>{W.score}</small></> : <span className="th-badge new">New</span>}</span>
  </a>;
}

export default async function ThreadStoryPage({ params }: P) {
  const { slug } = await params, s = await threadStory(slug);
  if (!s) {
    // A previous address (clean slugs, owner 2026-11-20): a permanent redirect to the story's current one.
    const to = await threadMovedStory(slug);
    if (to) permanentRedirect(`/stories/${to}`);
    notFound();
  }
  const [{ rows }, f, latest, stats] = await Promise.all([threadRows(), threadStoryFeatures(), threadStories(), threadAuthorStats(s.id)]);
  const more = latest.filter(x => x.id !== s.id).slice(0, 3);
  const extras = await threadStoryExtras([s, ...more]), x = extras.get(s.id);
  const tagged = s.rackets.map(id => rows.get(id)).filter((r): r is ThreadRow => !!r);
  const who = profileLine(s.author.level, s.author.side), av = avatarOf(s.author.name), topic = topicLabel(x?.topic), read = readMinutes(s.body);
  const ld = { "@context": "https://schema.org", "@graph": [
    crumbs([{ name: "Home", path: "/" }, { name: "Stories", path: "/stories" }, { name: s.title, path: `/stories/${s.slug}` }]),
    { "@type": "BlogPosting", headline: s.title, description: storyDescription(s.body), datePublished: s.at, dateModified: s.updatedAt,
      author: { "@type": "Person", name: s.author.name }, mainEntityOfPage: `${base()}/stories/${s.slug}`, publisher: { "@type": "Organization", name: niche.site.name } },
  ] };
  // The author card's numbers: stories always, ▲ once likes are on and there are some.
  const authorStats = [plural(stats.stories || 1, "story", "stories"), ...(f.likes && stats.likes > 0 ? [plural(stats.likes, "like")] : [])]
    .map(t => { const [n, ...rest] = t.split(" "); return { n, label: rest.join(" ") }; });
  return <Shell active="stories">
    <JsonLd data={ld}/>
    <main className="th-main ths"><div className="th-col">
      <div className="th-crumbs"><a href={th("/stories")}>Stories</a>{topic && <><span>/</span><span>{topic}</span></>}</div>
      <article id="story" className="th-card ths-post">
        <div className="ths-author">
          <span className="th7-av lg" style={{ background: av.bg }} aria-hidden="true">{av.init}</span>
          <span className="who"><span className="name"><strong>{s.author.name}</strong><MemberMark/>{who && <span>{who}</span>}</span>
            <span className="when">{`${day(s.at)} · ${read} min read`}{s.editedAt && ` · edited ${day(s.editedAt)}`}</span></span>
          {topic && <span className="ths-topic">{topic}</span>}
        </div>
        <h1 className="th-h1">{s.title}</h1>
        <StoryBody body={s.body}/>
        {tagged.map(r => <RacketCard key={r.id} r={r} label={tagged.length === 1 ? "Racket in this story" : "In this story"}/>)}
        <StoryActions id={s.id} slug={s.slug} likes={x?.likes ?? 0} comments={x?.comments ?? 0} likesOn={f.likes}/>
      </article>
      <Discussion page={`story:${s.slug}`} model={s.title} words={{ heading: "Comments", sub: `Been through something similar? Share it with ${first(s.author.name)}.`,
        ask: "Add a comment…", askIcon: "+", placeholder: `What did you think of ${first(s.author.name)}'s story?`, empty: "No comments yet. Start it off.", author: s.author.name }}/>
      {more.length > 0 && <section className="th-card ths-more-list">
        <h2 className="th-h2">More stories</h2>
        {more.map(m => { const n = extras.get(m.id)?.likes ?? 0;
          return <a key={m.id} href={th(`/stories/${m.slug}`)}><span><b>{m.title}</b><small>{`${m.author.name} · ${readMinutes(m.body)} min read`}</small></span>
            {f.likes && n > 0 && <span className="n">{`▲ ${n}`}</span>}</a>; })}
      </section>}
    </div>
    <aside className="th-side">
      <section className="th-card ths-box">
        <div className="ths-author"><span className="th7-av xl" style={{ background: av.bg }} aria-hidden="true">{av.init}</span>
          <span className="who"><span className="name"><strong>{s.author.name}</strong><MemberMark/></span>{who && <span className="when">{who}</span>}</span></div>
        <div className="ths-stats" style={{ gridTemplateColumns: `repeat(${authorStats.length}, minmax(0,1fr))` }}>
          {authorStats.map(a => <span key={a.label}><strong>{a.n}</strong><small>{a.label}</small></span>)}</div>
        {tagged[0] && <span className="ths-plays"><span>In this story</span>{" "}<a href={th(tagged[0].href)}>{tagged[0].name}</a></span>}
      </section>
      <section className="th-card ths-box lime">
        <span className="ths-box-h sm">Got a story too?</span>
        <span>A few paragraphs about your racket, your game or your comeback.</span>
        <a className="ths-box-btn" href={th("/stories/new")}>Share your story</a>
      </section>
    </aside></main>
  </Shell>;
}
