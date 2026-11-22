"use client";
// "From around the web" v2 (owner mock 2026-11-22, web-section-mock-owner.png). Header and subline, then source tabs
// without counts (All / Videos / Reddit / Blogs, a tab only when it has a card), then one row per summary: a real YouTube
// thumbnail, or a Reddit / blog tile with the source and date; then a headline and the summary; the sentiment on the right.
// WEB_V2_FIRST rows, then "Showing 6 of N" and "Show N more ↓". Filtering is in the browser, on the cards the page already
// has, so the page's ISR cache is untouched. Display only: none of it counts in the poll or the opinion counts.
// Video length and chapter chips come from YouTube itself (db/video-meta, lib/thread/video-meta.ts): the channel's own chapters,
// never made up or retimed; a video without them shows none.
import { useEffect, useMemo, useState } from "react";
import { W } from "../../../lib/thread/words";
import { subreddit } from "../../../lib/thread/display-name";
import { VERDICT } from "../ui";
import type { RvCard } from "../racket-data";
import { atSecond, clock } from "../../../lib/thread/video-meta";
import { dayLabel, isVideoComment, playersWord, tabOf, threadTitle, thumbOf, WEB_TABS, WEB_V2_FIRST, webList, webTabs,
  type WebGroups, type WebTab } from "../../../lib/thread/web-sources";

const OUT = { target: "_blank", rel: "noopener nofollow" } as const;

function Row({ c, kind }: { c: RvCard; kind: keyof WebGroups<RvCard> }) {
  const tab = tabOf(kind), text = playersWord(c.text, W.owner ?? W.person), day = dayLabel(c.at);
  const tag = <span className="th-wv-feel">{c.verdict && <span className={`th-vpill ${VERDICT[c.verdict][1]}`}>{VERDICT[c.verdict][0]}</span>}</span>;
  if (tab === "videos") {
    const thumb = thumbOf(c.url), comment = isVideoComment(c.url);
    return <article id={`rv-${c.id}`} className="th-wv-row">
      {thumb && c.url ? <a className="th-wv-thumb" href={c.url} {...OUT} aria-label={`Watch on YouTube: ${c.who}`}>
        <img src={thumb} alt="" loading="lazy" width={320} height={180}/><span className="play" aria-hidden="true"/>
        {c.len ? <span className="th-wv-len">{clock(c.len)}</span> : null}</a>
        : <span className="th-wv-thumb none" aria-hidden="true"/>}
      <div className="th-wv-b">
        <div className="th-wv-meta"><span className="th-web-src yt">▶ YouTube</span><b>{c.who}</b>
          {comment && <span>viewer comment</span>}{day && <span>{day}</span>}</div>
        <p className="th-wv-x lg">{text}</p>
        {c.url && c.chips && c.chips.length > 0 && <div className="th-wv-chips">{c.chips.map(([sec, t]) =>
          <a key={sec} className="th-wv-chip" href={atSecond(c.url!, sec)} {...OUT} aria-label={`Watch from ${clock(sec)}: ${t}`}><b>{clock(sec)}</b>{t}</a>)}</div>}
        {c.version && <span className="th-pill th-wv-ver">{c.version}</span>}
      </div>{tag}
    </article>;
  }
  // Reddit and blogs: the source tile, then a bold headline. A real short quote from the source when one is stored, in quote
  // marks with the summary under it; otherwise the summary itself is the headline, without quote marks.
  const reddit = tab === "reddit", title = reddit ? threadTitle(c.url) : null;
  const link = c.url && <a className="th-wv-go" href={c.url} {...OUT}>{reddit ? `${title ?? "View on Reddit"} ↗` : "Read the review ↗"}</a>;
  return <article id={`rv-${c.id}`} className="th-wv-row">
    <div className={`th-wv-tile ${reddit ? "r" : "bl"}`}>
      <span className={`th-web-src ${reddit ? "r" : "bl"}`}>{reddit ? "r/ Reddit" : "Blog"}</span>
      <b>{reddit ? subreddit(c.who) : c.who}</b>{day && <span>{day}</span>}
    </div>
    <div className="th-wv-b">
      {c.head ? <strong className="th-wv-h">{`"${c.head}"`}</strong> : <strong className="th-wv-h plain">{text}</strong>}
      {c.head && <p className="th-wv-x">{text}</p>}
      {c.version && <span className="th-pill th-wv-ver">{c.version}</span>}
      {link}
    </div>{tag}
  </article>;
}

export function WebSourcesV2({ web }: { web: WebGroups<RvCard> }) {
  const [tab, setTab] = useState<WebTab>("all"), [more, setMore] = useState(false);
  const list = useMemo(() => webList(web), [web]), tabs = useMemo(() => webTabs(web), [web]);
  // A tab that empties (DiscGolfRecs' plastic chips narrow `web`) falls back to All.
  const on: WebTab = tab === "all" || tabs.includes(tab) ? tab : "all";
  const shown = useMemo(() => on === "all" ? list : list.filter(x => tabOf(x.kind) === on), [list, on]);
  // A copied link to one card (#rv-w-…) opens the list on it.
  useEffect(() => { const h = location.hash.slice(1); if (!h.startsWith("rv-w-")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMore(true); setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "center" }), 50); }, []);
  if (!list.length) return null;
  const rows = more ? shown : shown.slice(0, WEB_V2_FIRST), rest = shown.length - rows.length;
  return <section id="web" className="th-card th-web th-wv">
    <div className="th-wv-hd">
      <div><h2 className="th-h2">From around the web</h2>
        <p className="th-web-sub">{`Short summaries of outside reviews. Not counted in the ${W.person} poll.`}</p></div>
      {tabs.length > 0 && <div className="th-wv-tabs" role="group" aria-label="Show sources">{WEB_TABS.filter(([k]) => tabs.includes(k)).map(([k, l]) =>
        <button key={k} type="button" aria-pressed={on === k} onClick={() => { setTab(k); setMore(false); }}>{l}</button>)}</div>}
    </div>
    <div className="th-wv-list">{rows.map(({ c, kind }) => <Row key={c.id} c={c} kind={kind}/>)}</div>
    {rest > 0 && <div className="th-wv-foot"><span>{`Showing ${rows.length} of ${shown.length}`}</span>
      <button type="button" onClick={() => setMore(true)}>{`Show ${rest} more ↓`}</button></div>}
  </section>;
}
