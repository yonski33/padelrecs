// Member stories (PadelRecs pilot, owner 2026-11-20), Stories v3 (owner design 2026-11-21, design_handoff_padelrecs_v3): a
// hero with Share your story and topic pills, the owner's Featured story, "Latest stories" rows (topic, title, excerpt, author,
// time, read time; △ and comments on the right), Load more, and a sidebar (Got a story?, Popular this month, Topics).
// The frame (topic pills, Topics, sort, △ counts) always shows; topics, Featured by the owner and ▲s fill in once drizzle/0033 is in.
import type { Metadata } from "next";
import { Shell } from "../shell";
import { threadStories, threadStoryExtras, threadStoryFeatures, threadLikedThisMonth } from "../stories-data";
import { th } from "../../../lib/thread/look";
import { storyDescription, readMinutes } from "../../../lib/thread/stories";
import { avatarOf } from "../../../lib/thread/avatar";
import { niche } from "../../../lib/niche";
import { ago } from "../ui";
import { StoryList, type StoryItem } from "../live/stories-v2";

export const revalidate = 21600;
const TITLE = "Player stories", INTRO = "First-hand stories from padel players about the game, the gear and everything around it.";
export const metadata: Metadata = { title: { absolute: `${TITLE} | ${niche.site.name}` }, description: INTRO, alternates: { canonical: "/stories" },
  openGraph: { title: TITLE, description: INTRO, url: "/stories", type: "website" } };

export default async function ThreadStories() {
  const [list, f] = await Promise.all([threadStories(), threadStoryFeatures()]);
  const [extras, top] = await Promise.all([threadStoryExtras(list), threadLikedThisMonth()]);
  const items: StoryItem[] = list.map(s => {
    const x = extras.get(s.id), a = avatarOf(s.author.name);
    return { id: s.id, slug: s.slug, title: s.title, excerpt: storyDescription(s.body), who: s.author.name, init: a.init, bg: a.bg,
      level: s.author.level, at: s.at, ago: ago(s.at), topic: x?.topic ?? null, featured: x?.featured ?? null,
      likes: x?.likes ?? 0, comments: x?.comments ?? 0, read: readMinutes(s.body) };
  });
  // Popular this month (PM v3 check 2026-11-21: shows at 2+ stories): the month's most ▲'d, else the most ▲'d and commented
  // overall, newest first on a tie, so the card is there before drizzle/0033 gives ▲s anywhere to live.
  const byId = new Map(list.map(s => [s.id, s]));
  const liked = top.map(t => ({ ...t, s: byId.get(t.id) })).filter(t => t.s);
  const popular = items.length < 2 ? [] : liked.length ? liked
    : [...items].sort((a, b) => b.likes - a.likes || b.comments - a.comments || b.at.localeCompare(a.at)).slice(0, 3).map(x => ({ id: x.id, likes: x.likes, s: byId.get(x.id) }));
  const hero = <div className="ths3-hero-top"><div className="words"><h1 className="th-h1">{TITLE}</h1><p>{INTRO}</p></div>
    <a className="ths3-share" href={th("/stories/new")}>+ Share your story</a></div>;
  const side = <>
    <section className="th-card ths3-box">
      <h3>Got a story?</h3>
      <p>A first match, a racket that changed your game, an injury comeback. Other players want to read it.</p>
      <ul className="ths3-rules"><li>150 to 600 words is plenty</li><li>Tag the racket you play with</li><li>No brand reps or paid posts</li></ul>
      <a className="ths3-btn" href={th("/stories/new")}>Start writing</a>
    </section>
    {popular.length > 0 && <section className="th-card ths3-box">
      <h3>Popular this month</h3>
      {popular.map((t, i) => <a key={t.id} className="ths3-pop" href={th(`/stories/${t.s!.slug}`)}><span className="n">{i + 1}</span>
        <span><b>{t.s!.title}</b><small>{`${t.s!.author.name} · △ ${t.likes}`}</small></span></a>)}
    </section>}
  </>;
  return <Shell active="stories">
    <main className="th-main ths3">
      {items.length === 0 ? <><section className="th-card ths3-hero">{hero}</section>
        <div className="ths3-grid"><div className="ths3-main"><section className="th-card ths3-list"><p className="ths3-none">No stories yet. Members can write the first one.</p></section></div>
          <aside className="ths3-side">{side}</aside></div></>
        : <StoryList items={items} likesOn={f.likes} hero={hero} side={side}/>}
    </main>
  </Shell>;
}
