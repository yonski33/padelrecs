import Link from "next/link";
import { catalog } from "../../db/data";
import { niche, productHref } from "../../lib/niche";
import { displayName } from "../../lib/brand-name";
import { plainSummary } from "../../lib/plain-summary";
import { shopPhoto, photoHidden } from "../../lib/shop-photos";
import { amazonPhoto } from "../../lib/amazon-photos";
import { qtFontVars } from "../qt-fonts";
import { V2Footer } from "../v2-footer";
import { rowOfFamily } from "../../lib/compare-pairs";
import { newThisWeek, WEEK_LONG } from "../../lib/new-this-week";
import { sideWord, playedWord } from "../../lib/byline";
import { fitConfigFor } from "../../lib/fit-config";
import { MIN_FIT_REPORTS } from "../../lib/fit-verdict";
import "./latest-v2.css";
import "../review-card.css";
import { VERDICT_PILL } from "../../lib/review-pill";
import "../skin/skin-product.css";
import "../skin/pages-beauty.css";
import { attrProfileFor } from "../../lib/attr-profile";

// Latest reviews in design v2 (owner 2026-11-15, Claude Design mockup https://claude.ai/artifact/JLXnpgtRmWgg6TRbc5BgHR),
// PadelRecs only. Owner: only our own players' reviews and the YouTube video summaries here, no forum (Reddit) or blog
// reports. Filters live in the URL (?src=players|yt&v=positive|mixed|negative), so every view is server-rendered.
// Second pass (owner 2026-11-15, updated mockup): the feed is grouped by day, each card has the racket photo on the left, a tilted
// verdict sticker, the player's words first and who wrote them under it; YouTube cards show "the gist" box.
const PAGE = 20, DAY = 864e5;
const PILL = VERDICT_PILL;
type Verdict = keyof typeof PILL;
type Search = { src?: string; v?: string; show?: string; older?: string; skin?: string };
const SKINS = ["dry", "normal", "combination", "oily"] as const;

/** The time this request renders at (a server component renders once per request). */
const requestTime = () => Date.now();
function ago(iso: string | null | undefined, now: number) {
  if (!iso) return null; const d = Math.max(0, (now - Date.parse(iso)) / DAY); if (!Number.isFinite(d)) return null;
  return d < 1 / 24 ? "just now" : d < 1 ? `${Math.floor(d * 24)}h ago` : d < 30 ? `${Math.floor(d)}d ago` : d < 365 ? `${Math.floor(d / 30)} mo ago` : `${Math.floor(d / 365)} yr ago`;
}
const sentences = (t: string) => t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/).map(x => x.trim()).filter(Boolean);
/** The day group a review falls in: today, yesterday, this week, this month, then month by month. */
function dayGroup(iso: string, now: number) {
  const t = Date.parse(iso), start = new Date(now); start.setHours(0, 0, 0, 0);
  const s = start.getTime();
  if (t >= s) return "today"; if (t >= s - DAY) return "yesterday"; if (t >= s - 6 * DAY) return "earlier this week"; if (t >= s - 29 * DAY) return "earlier this month";
  return new Date(t).toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toLowerCase();
}

export default async function LatestReviewsV2({ search }: { search: Search }) {
  // SkinRecs: the owner's beauty design (2026-11-16): its words, a skin-type filter (the reviewer's own skin type), brand above
  // the name. Padel's page is unchanged.
  const skinSite = !!attrProfileFor(niche);
  // Loaded only on SkinRecs, so other sites don't preload the beauty fonts.
  const fonts = skinSite ? await import("../skin/beauty-fonts") : null;
  const data = await catalog();
  const now = requestTime();
  const byId = new Map(data.rackets.map(r => [r.id, r]));
  const brand = (id: string) => data.brands.find(b => b.id === id)?.name;
  type Item = { key: string; racketId: string; date: string; verdict: Verdict | null; kind: "player" | "yt"; skinType?: string | null } & (
    { kind: "player"; who: string; meta: string[]; text: string; tags: string[] } | { kind: "yt"; who: string; url: string; comment: boolean; points: string[] });
  const all: Item[] = [
    ...data.reviews.map(r => ({ key: `p-${r.id}`, racketId: r.racketId, date: r.createdAt, kind: "player" as const,
      verdict: (r.rating >= 4 ? "positive" : r.rating === 3 ? "mixed" : "negative") as Verdict,
      who: r.alias || (skinSite ? `A ${niche.site.name.toLowerCase()} reviewer` : `A ${niche.site.name} player`), skinType: r.playerLevel?.toLowerCase() ?? null, meta: skinSite ? [r.playerLevel ? `${r.playerLevel.toLowerCase()} skin` : null].filter((x): x is string => !!x) : [r.playerLevel?.toLowerCase(), sideWord(r.playingSide)].filter((x): x is string => !!x),
      text: r.reviewText, tags: [playedWord(r.timeWithRacket, skinSite ? "used" : "played"), ...r.tags].filter((x): x is string => !!x).slice(0, 4) })),
    ...data.external.filter(e => e.sourcePlatform === "YouTube" && (e.summary || e.excerptTranslation || e.excerpt)).map(e => {
      const comment = /[?&]lc=/.test(e.sourceUrl), text = e.summary ? plainSummary(e.summary) : e.excerptTranslation || e.excerpt || "";
      return { key: `w-${e.id}`, racketId: e.racketId, date: e.sourceDate || e.createdAt, kind: "yt" as const, verdict: (e.sentiment ?? null) as Verdict | null,
        who: e.sourceName, url: e.sourceUrl, comment, points: e.summary && !comment ? sentences(text).slice(0, 4) : [text] };
    }),
  ].filter(x => byId.has(x.racketId)).sort((a, b) => b.date.localeCompare(a.date));
  const src = search.src === "players" || search.src === "yt" ? search.src : "all";
  const v = (["positive", "mixed", "negative"] as const).find(x => x === search.v) ?? null;
  const sk = skinSite ? SKINS.find(x => x === search.skin) ?? null : null;
  // One model, newest year (owner 2026-11-15, as quick match and the catalogue): reviews of a family's older years only with
  // ?older=1. The older pages and their reviews stay live there.
  // The year that takes the family's row (and a newer year still short of reports: its first reviews belong in a feed of
  // what's new), as in quick match and the catalogue.
  const reportsOf = new Map<string, number>();
  for (const x of [...data.reviews, ...data.external]) reportsOf.set(x.racketId, (reportsOf.get(x.racketId) ?? 0) + 1);
  const newest = new Set(data.listed.flatMap(r => { const row = rowOfFamily(r, data.listed, x => (reportsOf.get(x.id) ?? 0) >= MIN_FIT_REPORTS); return row.shown.id === r.id ? [r.id, ...(row.newer ? [row.newer.id] : [])] : []; }));
  const older = search.older === "1", isCurrent = (id: string) => newest.has(id) || !data.listed.some(r => r.id === id);
  const inSrc = (x: Item) => (src === "all" || (src === "players" ? x.kind === "player" : x.kind === "yt")) && (!v || x.verdict === v) && (!sk || x.skinType === sk);
  const olderN = all.filter(x => inSrc(x) && !isCurrent(x.racketId)).length;
  const items = all.filter(x => (older || isCurrent(x.racketId)) && inSrc(x));
  const show = Math.min(1000, Math.max(PAGE, Number(search.show) || PAGE));
  const groups: { label: string; items: { x: Item; i: number }[] }[] = [];
  items.slice(0, show).forEach((x, i) => { const label = dayGroup(x.date, now), last = groups.at(-1);
    if (last?.label === label) last.items.push({ x, i }); else groups.push({ label, items: [{ x, i }] }); });
  const href = (next: Partial<Search>) => { const q = new URLSearchParams(Object.entries({ src: src === "all" ? undefined : src, v: v ?? undefined, skin: sk ?? undefined, older: older ? "1" : undefined, ...next }).filter(([, x]) => x) as [string, string][]); return q.size ? `/reviews?${q}` : "/reviews"; };
  const week = all.filter(x => Date.parse(x.date) >= now - 7 * DAY);
  const counts = new Map<string, number>();
  for (const x of week) counts.set(x.racketId, (counts.get(x.racketId) ?? 0) + 1);
  const hot = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const photo = (r: (typeof data.rackets)[number]) => photoHidden(r) ? null : shopPhoto(r) ?? amazonPhoto(r)?.image ?? null;
  const nameOf = (id: string) => { const r = byId.get(id)!; return displayName(r.name, brand(r.brandId)); };
  // Skin: the brand on its own line above the name (owner's design).
  const nameOnly = (id: string) => { const r = byId.get(id)!, b = brand(r.brandId) ?? "", n = nameOf(id); return b && n.toLowerCase().startsWith(`${b.toLowerCase()} `) ? n.slice(b.length + 1) : n; };

  return <>
    <main className={fonts ? `lr2 bp bl ${fonts.bpFontVars}` : `lr2 ${qtFontVars}`}>
      {fonts && <style>{fonts.bpBodyFonts}</style>}
      <section className="lr2-hero">
        <div><h1>{skinSite ? <>Latest <em>reviews</em></> : "Latest reviews"}</h1>
          <p>{`Straight from ${skinSite ? "people" : fitConfigFor(niche)?.words ? niche.people.many : "players"} who use this site, plus the useful bits of YouTube reviews so you don't have to watch 20 minutes.`}</p></div>
        <p className="lr2-live"><i aria-hidden="true"/>{`${newThisWeek(data, now).toLocaleString("en-US")} ${WEEK_LONG}`}</p>
      </section>
      <div className="lr2-bar">
        <nav className="lr2-tabs" aria-label="Source">{([["all", "all"], ["players", skinSite ? "from people" : "from players"], ["yt", "youtube summaries"]] as const).map(([k, label]) =>
          <Link key={k} href={href({ src: k === "all" ? undefined : k, show: undefined })} aria-current={src === k ? "true" : undefined}>{label}</Link>)}</nav>
        {skinSite && <div className="lr2-vs"><span>skin</span>{SKINS.map(k =>
          <Link key={k} href={href({ skin: sk === k ? undefined : k, show: undefined })} aria-current={sk === k ? "true" : undefined}>{k}</Link>)}</div>}
        <div className="lr2-vs"><span>verdict</span>{(["positive", "mixed", "negative"] as const).map(k =>
          <Link key={k} href={href({ v: v === k ? undefined : k, show: undefined })} aria-current={v === k ? "true" : undefined}>{PILL[k]}</Link>)}</div>
      </div>
      <div className="lr2-grid">
        <section className="lr2-feed">
          {groups.map(g => <div key={g.label} className="lr2-day">
            <div className="lr2-dh"><span>{g.label}</span><i aria-hidden="true"/><small>{`${g.items.length} ${g.items.length === 1 ? "review" : "reviews"}`}</small></div>
            {g.items.map(({ x, i }) => { const r = byId.get(x.racketId)!, pic = photo(r), href = productHref(r); return <article key={x.key}>
              <a className="lr2-pic" href={href} tabIndex={-1} aria-hidden="true">{pic && <img src={pic} alt="" width={408} height={620} decoding="async" loading={i < 4 ? "eager" : "lazy"}/>}</a>
              <div className="lr2-body">
                <div className="lr2-head">{skinSite ? <a className="lr2-name" href={href}><small className="bl-brand">{brand(r.brandId)}</small>{nameOnly(x.racketId)}</a> : <a className="lr2-name" href={href}>{nameOf(x.racketId)}</a>}
                  {x.verdict && <span className={`lr2-pill ${x.verdict}${i % 2 ? " r" : ""}`}>{PILL[x.verdict]}</span>}</div>
                {x.kind === "player" ? <>
                  <p className="lr2-text">{x.text}</p>
                  <div className="lr2-who"><span className={`lr2-av a${i % 4}`} aria-hidden="true">{x.who[0]?.toUpperCase()}</span><strong>{x.who}</strong>
                    {x.meta.map(m => <span key={m}>{`· ${m}`}</span>)}<span className="lr2-when">{ago(x.date, now)}</span></div>
                  {x.tags.length > 0 && <div className="lr2-tags">{x.tags.map(t => <span key={t}>{t}</span>)}</div>}
                </> : <>
                  <div className="lr2-gist"><p className="lr2-k">{x.comment ? "a viewer's comment, summarised" : x.points.length > 1 ? `the gist, in ${x.points.length} lines` : "the gist"}</p>
                    {x.points.map((p, j) => <p key={j} className="lr2-pt"><span aria-hidden="true">→</span>{p}</p>)}</div>
                  <div className="lr2-who"><span className="lr2-yt" aria-hidden="true">▶</span><strong>{x.who}</strong><span>· youtube</span>
                    <a className="lr2-watch" href={x.url} target="_blank" rel="noopener nofollow">{x.comment ? "see the comment ↗" : "watch ↗"}</a><span className="lr2-when">{ago(x.date, now)}</span></div>
                </>}
              </div>
            </article>; })}
          </div>)}
          {items.length === 0 && <div className="lr2-empty">Nothing like that yet</div>}
          {olderN > 0 && <Link className="lr2-older" href={href({ older: older ? undefined : "1", show: undefined })} scroll={false}>{older ? "hide older models ▴" : `show older models (${olderN} reviews) ▾`}</Link>}
          {items.length > show && <Link className="lr2-more" href={href({ show: String(show + PAGE) })} scroll={false}>load older reviews ↓</Link>}
        </section>
        <aside className="lr2-side">
          <div className="lr2-own"><p className="t">{skinSite ? "Used something? Share how your skin took it." : `Own a ${niche.words.one}? Add your verdict.`}</p><p>Two minutes, no account. It shows up here and moves the rankings.</p><a href="/add-review">+ add a review</a></div>
          {hot.length > 0 && <div><h3>Most reviewed this week</h3>
            <ol className="lr2-hot">{hot.map(([id, n], i) => <li key={id}><a href={productHref(byId.get(id)!)}><span>{i + 1}</span><b>{nameOf(id)}</b><small>{`+${n}`}</small></a></li>)}</ol></div>}
          <div className="lr2-note"><p className="lr2-k">{skinSite ? "about the youtube bits" : "// about the youtube bits"}</p>We watch the review, pull out what the reviewer actually concluded, and link the video. Creators get the views.</div>
        </aside>
      </div>
    </main>
    <V2Footer/>
  </>;
}
