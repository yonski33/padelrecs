// The Thread look's small pieces (README "Shared components"): no hooks and no server imports, so server pages and the
// browser widgets (app/thread/live/*) render the same markup.
import type { ReactNode } from "react";
import { th } from "../../lib/thread/look";

/** One list row's data (home, catalogue, rankings, guides). Real counts show at any size (owner 2026-11-19); 0 stays blank. */
export type ThreadRow = {
  id: string; slug: string; name: string; href: string; pic: string | null; shape: string | null;
  line: string | null; best: string | null; n: number; pos: number; mix: number; neg: number;
  /** The live, volume-weighted Player score (lib/signal.ts), null until a racket has enough reviews. */ score: number | null;
  brand: string; year: number; levels: ("beginner" | "intermediate" | "advanced")[]; feel: "Soft" | "Medium" | "Hard" | null; arm: boolean;
  /** The year that takes its model's row (lib/compare-pairs.ts familyRowIds, the classic catalog's and home's rule). Older
   *  years (false) stay reachable by their page and the catalog's search or "Show older models". */ current?: boolean;
};
/** Counts show at any size (owner 2026-11-19: the "under 5" rule is gone); 0 stays blank. Written claims ("N players say…")
 *  keep their own 5-backer rule where they're made (app/thread/racket-data.ts, data.ts boards). */
export const MIN_SHOWN = 1;
/** The poll shows percentages from this many votes; below it, counts only ("Loved it · 3"). */
export const POLL_PCT_AT = 10;
export const VERDICT = { positive: ["Loved it", "pos"], mixed: ["Mixed", "mix"], negative: ["Not for me", "neg"] } as const;
export const SOURCE = { youtube: ["YouTube", "yt"], blog: ["Blog", "blog"], reddit: ["Reddit", "reddit"] } as const;
/** "2h ago", "5 days ago", "Nov 4" (the mocks' timestamps). */
export function ago(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "";
  const t = Date.parse(iso); if (Number.isNaN(t)) return "";
  const h = Math.floor((now - t) / 3_600_000);
  if (h < 1) return "just now"; if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d === 1) return "1 day ago"; if (d < 7) return `${d} days ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(new Date(t).getUTCFullYear() !== new Date(now).getUTCFullYear() ? { year: "numeric" } : {}), timeZone: "UTC" });
}
/** README: green 85+, yellow 70 to 84, white under 70 (scores and match % alike). */
export const tone = (n: number | null | undefined) => n == null ? "" : n >= 85 ? "g" : n >= 70 ? "y" : "w";
export const cap = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

export function Badge({ n, label = "player score", size, pct }: { n: number | null; label?: string; size?: "sm" | "xs"; pct?: boolean }) {
  if (n == null) return <span className="th-badge-col"><span className={`th-badge new${size ? ` ${size}` : ""}`}>New</span><span className="th-badge-lbl">not enough votes yet</span></span>;
  return <span className="th-badge-col"><span className={`th-badge ${tone(n)}${size ? ` ${size}` : ""}`}>{pct ? `${n}%` : n}</span><span className="th-badge-lbl">{label}</span></span>;
}
export function SBar({ pos, mix, neg, lg }: { pos: number; mix: number; neg: number; lg?: boolean }) {
  return <span className={`th-sbar${lg ? " lg" : ""}`} aria-label={`${pos} loved it, ${mix} mixed, ${neg} not for me`}><i style={{ flex: pos }}/><i style={{ flex: mix }}/><i style={{ flex: neg }}/></span>;
}
export function Photo({ src, className = "th-photo", href }: { src: string | null; className?: string; href?: string }) {
  const inner = src ? <img src={src} alt="" loading="lazy"/> : <span className="th-ph" aria-hidden="true"/>;
  return href ? <a className={className} href={th(href)} tabIndex={-1} aria-hidden="true">{inner}</a> : <span className={className}>{inner}</span>;
}

/** The list row: photo · name + shape pill · one-line verdict · "Best for …" · reviews + sentiment bar · "See reviews ›" · badge.
 *  `badge` is the match % when the visitor picked, else the Player score. */
export function Row({ r, rank, badge, badgeLabel = "player score", pct }: { r: ThreadRow; rank?: number; badge?: number | null; badgeLabel?: string; pct?: boolean }) {
  const b = badge === undefined ? r.score : badge, href = th(r.href);
  const judged = r.pos + r.mix + r.neg;
  return <div className={`th-row${rank ? "" : " norank"}`}>
    {rank ? <span className="th-rank">{rank}</span> : null}
    <Photo src={r.pic} href={r.href}/>
    <div className="th-row-body">
      <span className="th-row-name">{rank ? <span className="mrank">{rank}.</span> : null}<a href={href}>{r.name}</a>{r.shape && <span className="th-pill">{cap(r.shape)}</span>}</span>
      {r.line && <span className="th-verdict">{r.line}</span>}
      {r.best && <span className="th-best">{`Best for ${r.best}`}</span>}
      <span className="th-meta">{r.n >= MIN_SHOWN && <span>{plural(r.n, "review")}</span>}{judged >= MIN_SHOWN && <SBar pos={r.pos} mix={r.mix} neg={r.neg}/>}<a className="go" href={href}>See reviews ›</a></span>
    </div>
    <Badge n={b} label={badgeLabel} pct={pct}/>
    <div className="th-row-foot">
      <span>{b == null ? <span className="th-badge new">New</span> : <span className={`th-badge ${tone(b)}`}>{pct ? `${b}%` : b}</span>}{b == null ? "not enough votes yet" : badgeLabel}</span>
      <a href={href}>See reviews ›</a>
    </div>
  </div>;
}

export function SideBox({ title, children }: { title: string; children: ReactNode }) {
  return <section className="th-card th-sbox"><div className="th-sbox-head">{title}</div><div className="th-sbox-body">{children}</div></section>;
}
export function LinkList({ links, current }: { links: { label: string; href: string }[]; current?: string }) {
  return <>{links.map(l => <a key={l.href} className="th-slink" href={th(l.href)} aria-current={l.href === current ? "page" : undefined}><span>{l.label}</span><span aria-hidden="true">→</span></a>)}</>;
}
/** The same links as a card in the main column, for screens without the sidebar. */
export function NarrowLinks({ title, links, current }: { title: string; links: { label: string; href: string }[]; current?: string }) {
  return <section className="th-card th-narrow" style={{ padding: "12px 16px", flexDirection: "column" }}><span className="th-stitle">{title}</span><LinkList links={links} current={current}/></section>;
}
