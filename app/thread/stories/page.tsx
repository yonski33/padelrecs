// Member stories (PadelRecs pilot, owner 2026-11-20): short posts by members, newest first.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { threadStories } from "../stories-data";
import { th } from "../../../lib/thread/look";
import { MemberMark } from "../live/member-mark";
import { storyDescription } from "../../../lib/thread/stories";
import { niche } from "../../../lib/niche";
import { plural } from "../ui";

export const revalidate = 3600;
const TITLE = "Stories from padel players", DESCRIPTION = "Short posts by padel players: what they learned, what they would change, and what surprised them.";
export const metadata: Metadata = { title: { absolute: `${TITLE} | ${niche.site.name}` }, description: DESCRIPTION, alternates: { canonical: "/stories" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/stories", type: "website" } };
const day = (at: string) => new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function ThreadStories() {
  const list = await threadStories();
  return <Shell active="stories">
    <main className="th-main"><div className="th-col">
      <section className="th-card th-hero">
        <div className="th-h1-row"><h1 className="th-h1">Stories</h1><a className="th-btn round lime" href={th("/stories/new")}>Write a story</a></div>
        <p className="th-lead">{DESCRIPTION} Members write them; anyone can join in below each one.</p>
      </section>
      <section className="th-card th-sec">
        {list.length === 0 ? <p className="th-note">No stories yet. Members can write the first one.</p>
          : <ul className="th-stories">{list.map(s => <li key={s.id}>
            <a className="th-story-t" href={th(`/stories/${s.slug}`)}>{s.title}</a>
            <span className="th-story-by"><strong>{s.author.name}</strong><MemberMark/><span>{`· ${day(s.at)}`}</span>{s.rackets.length > 0 && <span>{`· ${plural(s.rackets.length, "racket")}`}</span>}</span>
            <p>{storyDescription(s.body)}</p>
          </li>)}</ul>}
      </section>
    </div></main>
  </Shell>;
}
