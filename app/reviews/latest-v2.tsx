import Link from "next/link";
import { catalog } from "../../db/data";
import { niche, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { plainSummary } from "../../lib/plain-summary";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import "./latest-v2.css";

// Latest reviews in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/JLXnpgtRmWgg6TRbc5BgHR),
// PadelRecs only. Owner: only our own players' reviews and the YouTube video summaries here, no forum (Reddit) or blog
// reports. Filters live in the URL (?src=players|yt&v=positive|mixed|negative), so every view is server-rendered.
const PAGE = 20, DAY = 864e5;
const PILL = { positive: "👍 loved it", mixed: "🤷 mixed", negative: "👎 not for me" } as const;
type Verdict = keyof typeof PILL;
type Search = { src?: string; v?: string; show?: string };

/** The time this request renders at (a server component renders once per request). */
const requestTime = () => Date.now();
function ago(iso: string | null | undefined, now: number) {
  if (!iso) return null; const d = Math.max(0, (now - Date.parse(iso)) / DAY); if (!Number.isFinite(d)) return null;
  return d < 1 / 24 ? "just now" : d < 1 ? `${Math.floor(d * 24)}h ago` : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
}
const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
const videoId = (url: string) => { try { const u = new URL(url); return u.searchParams.get("v") ?? (u.hostname === "youtu.be" ? u.pathname.slice(1) : null); } catch { return null; } };

export default async function LatestReviewsV2({ search }: { search: Search }) {
  const data = await catalog();
  const now = requestTime();
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  const timeWord = new Map(niche.profile.timeWithRacket?.options.map(o => [o.value, (o as { display?: string }).display ?? o.value.toLowerCase()]) ?? []);
  type Item = { key: string; racketId: string; date: string; verdict: Verdict | null; kind: "player" | "yt" } & (
    { kind: "player"; who: string; meta: string; text: string; tags: string[] } | { kind: "yt"; who: string; url: string; video: string | null; comment: boolean; points: string[] });
  const all: Item[] = [
    ...data.reviews.map(r => ({ key: `p-${r.id}`, racketId: r.racketId, date: r.createdAt, kind: "player" as const,
      verdict: (r.rating >= 4 ? "positive" : r.rating === 3 ? "mixed" : "negative") as Verdict,
      who: r.alias || `A ${niche.site.name} player`, meta: [r.playerLevel?.toLowerCase(), r.playingSide ? `${r.playingSide.toLowerCase()} side` : null].filter(Boolean).join(" · "),
      text: r.reviewText, tags: [r.timeWithRacket ? `played ${timeWord.get(r.timeWithRacket) ?? r.timeWithRacket.toLowerCase()}` : null, ...r.tags].filter((x): x is string => !!x).slice(0, 4) })),
    ...data.external.filter(e => e.sourcePlatform === "YouTube" && (e.summary || e.excerptTranslation || e.excerpt)).map(e => {
      const comment = /[?&]lc=/.test(e.sourceUrl), text = e.summary ? plainSummary(e.summary) : e.excerptTranslation || e.excerpt || "";
      return { key: `w-${e.id}`, racketId: e.racketId, date: e.sourceDate || e.createdAt, kind: "yt" as const, verdict: (e.sentiment ?? null) as Verdict | null,
        who: e.sourceName, url: e.sourceUrl, video: videoId(e.sourceUrl), comment, points: e.summary && !comment ? sentences(text).slice(0, 4) : [text] };
    }),
  ].filter(x => byId.has(x.racketId)).sort((a, b) => b.date.localeCompare(a.date));
  const src = search.src === "players" || search.src === "yt" ? search.src : "all";
  const v = (["positive", "mixed", "negative"] as const).find(x => x === search.v) ?? null;
  const items = all.filter(x => (src === "all" || (src === "players" ? x.kind === "player" : x.kind === "yt")) && (!v || x.verdict === v));
  const show = Math.min(1000, Math.max(PAGE, Number(search.show) || PAGE));
  const href = (next: Partial<Search>) => { const q = new URLSearchParams(Object.entries({ src: src === "all" ? undefined : src, v: v ?? undefined, ...next }).filter(([, x]) => x) as [string, string][]); return q.size ? `/reviews?${q}` : "/reviews"; };
  const week = all.filter(x => Date.parse(x.date) >= now - 7 * DAY);
  const counts = new Map<string, number>();
  for (const x of week) counts.set(x.racketId, (counts.get(x.racketId) ?? 0) + 1);
  const hot = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const nameOf = (id: string) => { const r = byId.get(id)!; return displayName(r.name, brand(r.brandId)); };

  return <>
    <main className={`lr2 ${qtFontVars}`}>
      <section className="lr2-hero">
        <div><h1>Latest reviews</h1>
          <p>{"Straight from players who use this site, plus the useful bits of YouTube reviews so you don't have to watch 20 minutes."}</p></div>
        <p className="lr2-live"><i aria-hidden="true"/>{`${week.length} new this week`}</p>
      </section>
      <div className="lr2-bar">
        <nav className="lr2-tabs" aria-label="Source">{([["all", "all"], ["players", "from players"], ["yt", "youtube summaries"]] as const).map(([k, label]) =>
          <Link key={k} href={href({ src: k === "all" ? undefined : k, show: undefined })} aria-current={src === k ? "true" : undefined}>{label}</Link>)}</nav>
        <div className="lr2-vs"><span>verdict</span>{(["positive", "mixed", "negative"] as const).map(k =>
          <Link key={k} href={href({ v: v === k ? undefined : k, show: undefined })} aria-current={v === k ? "true" : undefined}>{PILL[k]}</Link>)}</div>
      </div>
      <div className="lr2-grid">
        <section className="lr2-feed">
          {items.slice(0, show).map((x, i) => { const r = byId.get(x.racketId)!, pic = photo(r); return <article key={x.key}>
            <a className="lr2-top" href={productHref(r)}>
              <span className="lr2-pic">{pic && <img src={pic} alt="" loading={i < 4 ? "eager" : "lazy"}/>}</span>
              <span className="lr2-name">{nameOf(x.racketId)}</span>
              {x.verdict && <span className={`lr2-pill ${x.verdict}`}>{PILL[x.verdict]}</span>}
            </a>
            {x.kind === "player" ? <div className="lr2-player">
              <div className="lr2-who"><span className={`lr2-av a${i % 4}`} aria-hidden="true">{x.who[0]?.toUpperCase()}</span><strong>{x.who}</strong>{x.meta && <span className="lr2-meta">{x.meta}</span>}<span className="lr2-when">{ago(x.date, now)}</span></div>
              <p>{x.text}</p>
              {x.tags.length > 0 && <div className="lr2-tags">{x.tags.map(t => <span key={t}>{t}</span>)}</div>}
            </div> : <div className="lr2-yt">
              <a className="lr2-thumb" href={x.url} target="_blank" rel="noopener nofollow" aria-label={`Watch on YouTube: ${x.who}`}>{x.video && <img src={`https://i.ytimg.com/vi/${x.video}/mqdefault.jpg`} alt="" loading="lazy"/>}<span aria-hidden="true">▶</span></a>
              <div>
                <div className="lr2-who"><span className="lr2-tag">youtube</span><strong>{x.who}</strong><span className="lr2-when">{ago(x.date, now)}</span></div>
                <p className="lr2-k">{x.comment ? "// a viewer's comment under the video, summarised" : "// our summary"}</p>
                {x.points.length > 1 ? <ul>{x.points.map((p, j) => <li key={j}>{p}</li>)}</ul> : <p className="lr2-one">{x.points[0]}</p>}
                <a className="lr2-watch" href={x.url} target="_blank" rel="noopener nofollow">{x.comment ? "see the comment on youtube ↗" : "watch on youtube ↗"}</a>
              </div>
            </div>}
          </article>; })}
          {items.length === 0 && <div className="lr2-empty">Nothing like that yet 🤷</div>}
          {items.length > show && <Link className="lr2-more" href={href({ show: String(show + PAGE) })} scroll={false}>load older reviews ↓</Link>}
        </section>
        <aside className="lr2-side">
          <div className="lr2-own"><p className="t">Own a racket? Add your verdict.</p><p>Two minutes, no account. It shows up here and moves the rankings.</p><a href="/add-review">+ add a review</a></div>
          {hot.length > 0 && <div><h3>Most reviewed this week</h3>
            <ol className="lr2-hot">{hot.map(([id, n], i) => <li key={id}><a href={productHref(byId.get(id)!)}><span>{i + 1}</span><b>{nameOf(id)}</b><small>{`+${n}`}</small></a></li>)}</ol></div>}
          <div className="lr2-note"><p className="lr2-k">{"// about the youtube bits"}</p>We watch the review, pull out what the reviewer actually concluded, and link the video. Creators get the views.</div>
        </aside>
      </div>
    </main>
    <V2Footer/>
  </>;
}
