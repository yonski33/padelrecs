// One member story (PadelRecs pilot, owner 2026-11-20): the title, its author with the member mark, the text in paragraphs, the
// rackets it tags, and the usual comments (page "story:<slug>", Reply on replies).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../../shell";
import { threadStory } from "../../stories-data";
import { threadRows } from "../../data";
import { Row, type ThreadRow } from "../../ui";
import { Comments } from "../../live/comments";
import { MemberMark } from "../../live/member-mark";
import { JsonLd, crumbs, base } from "../../seo";
import { th } from "../../../../lib/thread/look";
import { storyDescription } from "../../../../lib/thread/stories";
import { StoryBody } from "../../story-body";
import { StoryTools } from "../../live/story-tools";
import { profileLine } from "../../../../lib/thread/display-name";
import { niche } from "../../../../lib/niche";

export const revalidate = 3600;
type P = { params: Promise<{ slug: string }> };
const day = (at: string) => new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = await threadStory((await params).slug);
  if (!s) return { title: "Story not found", robots: { index: false } };
  const url = `/stories/${s.slug}`, description = storyDescription(s.body);
  return { title: { absolute: `${s.title} | ${niche.site.name}` }, description, alternates: { canonical: url },
    openGraph: { title: s.title, description, url, type: "article", publishedTime: s.at, modifiedTime: s.updatedAt, authors: [s.author.name] } };
}

export default async function ThreadStoryPage({ params }: P) {
  const s = await threadStory((await params).slug);
  if (!s) notFound();
  const { rows } = await threadRows();
  const tagged = s.rackets.map(id => rows.get(id)).filter((x): x is ThreadRow => !!x);
  const who = profileLine(s.author.level, s.author.side);
  const ld = { "@context": "https://schema.org", "@graph": [
    crumbs([{ name: "Home", path: "/" }, { name: "Stories", path: "/stories" }, { name: s.title, path: `/stories/${s.slug}` }]),
    { "@type": "BlogPosting", headline: s.title, description: storyDescription(s.body), datePublished: s.at, dateModified: s.updatedAt,
      author: { "@type": "Person", name: s.author.name }, mainEntityOfPage: `${base()}/stories/${s.slug}`, publisher: { "@type": "Organization", name: niche.site.name } },
  ] };
  return <Shell active="stories">
    <JsonLd data={ld}/>
    <main className="th-main"><div className="th-col">
      <div className="th-crumbs"><a href={th("/stories")}>Stories</a></div>
      <article className="th-card th-post"><div className="th-post-in">
        <h1 className="th-h1">{s.title}</h1>
        <div className="th-by"><strong>{s.author.name}</strong><MemberMark/>{who && <><span>·</span><span>{who}</span></>}<span>·</span><span>{day(s.at)}</span>
          {s.editedAt && <><span>·</span><span>{`edited ${day(s.editedAt)}`}</span></>}<StoryTools slug={s.slug} id={s.id}/></div>
        <StoryBody body={s.body}/>
      </div></article>
      {tagged.length > 0 && <section className="th-card th-list"><h2 className="th-h2" style={{ margin: "4px 0 6px" }}>Rackets in this story</h2>
        {tagged.map(r => <Row key={r.id} r={r}/>)}</section>}
      <Comments page={`story:${s.slug}`} nicknames={niche.form.quickVote?.nicknames ?? []}/>
    </div></main>
  </Shell>;
}
