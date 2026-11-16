"use client";
// "Similar products" at the foot of every product page (owner 2026-11-16, Claude Design mockups): one list on single-category
// sites (lib/niche similar.mode "single"), or two tabs — "Similar" and the site's second list ("Pairs well with" on SkinRecs,
// "Complete your bag" on DiscGolfRecs, "Works with" on SimRacingRecs). The lists are worked out on the server with the page
// (lib/similar-picks.ts); this only switches tabs and shows each card's badge: the visitor's match % when the page knows their
// picks (`pct`, from the racket page's fit check), else the Player score.
import { useState } from "react";
import "./similar.css";

export type SimilarItem = { id: string; name: string; href: string; /** The small tile's word: the shape, type or step. */ tag: string;
  tint: string; /** The product photo (the list rows' own, app/visual.tsx productPhoto); the tag tile only without one. */ photo?: string | null;
  /** One short difference or reason ("more forgiving", "SPF step"). */ why: string | null; line: string | null; score: number | null;
  /** The price on file ("~$17"), where the site keeps one (SkinRecs); none elsewhere. */ price?: string | null };
export type SimilarTab = { key: string; label: string; sub: string; /** The sub line once the visitor's picks are known. */ subPicked?: string;
  items: SimilarItem[]; more: { href: string; label: string } | null };

export function SimilarSection({ title, tabs, pct, scoreLabel, picksHref = "", look }: { title: string; tabs: SimilarTab[]; /** The site's look (lib/niche similar.look). */ look?: "soft" | "disc";
  /** Match % per item id for the visitor's picks; null without picks. */ pct?: Record<string, number | null> | null; scoreLabel: string;
  /** The picks' query, carried to the cards' pages ("?style=…"). */ picksHref?: string }) {
  const shown = tabs.filter(t => t.items.length > 0);
  const [key, setKey] = useState(shown[0]?.key);
  const tab = shown.find(t => t.key === key) ?? shown[0];
  if (!tab) return null;
  const picked = !!pct;
  const items = picked ? [...tab.items].sort((a, b) => (pct[b.id] ?? -1) - (pct[a.id] ?? -1)) : tab.items;
  return <section id="similar" className={`sp-sim${look ? ` sp-${look}` : ""}`} aria-labelledby="sp-sim-h">
    <div className="sp-head">
      <div><h2 id="sp-sim-h">{title}</h2><span className="sp-sub">{picked && tab.subPicked ? tab.subPicked : tab.sub}</span></div>
      {shown.length > 1 && <div className="sp-tabs" role="tablist" aria-label={title}>{shown.map(t =>
        <button key={t.key} type="button" role="tab" aria-selected={t.key === tab.key} onClick={() => setKey(t.key)}>{t.label}</button>)}</div>}
    </div>
    <div className="sp-grid" role={shown.length > 1 ? "tabpanel" : undefined}>{items.map(p => {
      const m = picked ? pct[p.id] ?? null : null, badge = picked ? (m === null ? "—" : `${m}%`) : p.score === null ? "—" : String(p.score);
      return <a key={p.id} className="sp-card" href={`${p.href}${picksHref}`}>
        <span className="sp-top">
          {p.photo ? <span className="sp-tag sp-photo" aria-hidden="true"><img src={p.photo} alt="" width={48} height={48} loading="lazy" decoding="async"/></span>
            : <span className="sp-tag" style={{ background: p.tint }}>{p.tag}</span>}
          <span className="sp-badge"><b className={picked && (m ?? 0) < 80 ? "plain" : undefined}>{badge}</b><small>{picked ? "your match" : scoreLabel}</small></span>
        </span>
        <span className="sp-name">{p.name}</span>
        {p.why && <span className="sp-why">{p.why}</span>}
        {p.line && <span className="sp-line">{p.line}</span>}
        <span className="sp-foot"><span className="sp-price">{p.price ?? ""}</span><span className="sp-go">see it →</span></span>
      </a>;
    })}</div>
    {tab.more && <a className="sp-more" href={tab.more.href}>{tab.more.label}</a>}
  </section>;
}
