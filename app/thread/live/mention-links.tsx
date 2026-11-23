"use client";
// Product mentions as links in review text (lib/thread/mention-links.ts does the matching). A named product links to its
// page with a subtle dotted underline; on a desktop pointer, hovering shows a small card (photo, name, the site's
// player-vote bar, lowest price, View →). On touch a tap just follows the link. The "Compared to" box lists the named
// products as small chips with a thumbnail, and a "Compare side by side" link where the compare page has both.
// Shared: wrap a list in <MentionsProvider> with the index and targets the server built for the page.
import "./mention-links.css";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { splitMentions, type MentionKeys } from "../../../lib/thread/mention-links";

export type MentionTarget = { id: string; slug: string; name: string; href: string; pic: string | null;
  /** Share of the site's players who loved it, 0-100, or null with no votes. */ loved: number | null; votes: number; price: number | null };
type Ctx = { index: MentionKeys[]; targets: Record<string, MentionTarget>; selfId: string; selfSlug: string; unit: string; noun: string;
  compareHref?: (a: string, b: string) => string; show: (id: string, el: HTMLElement) => void; hide: () => void };
const C = createContext<Ctx | null>(null);
export const useMentions = () => useContext(C);

const usd = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function MentionsProvider({ index, targets, selfId, selfSlug, unit = "players", noun = "paddle", compare = true, children }: {
  index: MentionKeys[]; targets: Record<string, MentionTarget>; selfId: string; selfSlug: string; unit?: string; noun?: string; compare?: boolean; children: ReactNode }) {
  const [card, setCard] = useState<{ id: string; x: number; y: number; up: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fine = useRef(false);
  useEffect(() => { fine.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches; }, []);
  const show = useCallback((id: string, el: HTMLElement) => {
    if (!fine.current || !targets[id]) return;
    if (timer.current) clearTimeout(timer.current);
    const r = el.getBoundingClientRect(), up = r.bottom + 220 > window.innerHeight;
    setCard({ id, x: Math.min(Math.max(8, r.left), window.innerWidth - 288), y: up ? r.top - 8 : r.bottom + 8, up });
  }, [targets]);
  const hide = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setCard(null), 160); }, []);
  const keep = () => { if (timer.current) clearTimeout(timer.current); };
  useEffect(() => { if (!card) return; const off = () => setCard(null); window.addEventListener("scroll", off, { passive: true }); return () => window.removeEventListener("scroll", off); }, [card]);
  const t = card ? targets[card.id] : null;
  const compareHref = compare ? (a: string, b: string) => `/compare?ids=${encodeURIComponent(a)},${encodeURIComponent(b)}` : undefined;
  return <C.Provider value={{ index, targets, selfId, selfSlug, unit, noun, compareHref, show, hide }}>
    {children}
    {card && t && <a className={`mxc${card.up ? " up" : ""}`} href={t.href} style={{ left: card.x, top: card.y }} onMouseEnter={keep} onMouseLeave={hide}>
      {t.pic ? <img src={t.pic} alt="" width={56} height={76} loading="lazy"/> : <span className="mxc-ph" aria-hidden="true"/>}
      <span className="mxc-b">
        <strong>{t.name}</strong>
        {t.loved != null && <><span className="mxc-bar" aria-hidden="true"><i style={{ width: `${t.loved}%` }}/></span>
          <span className="mxc-m">{`${t.loved}% loved · ${t.votes} ${unit}`}</span></>}
        {t.price != null && <span className="mxc-m">{`from ${usd(t.price)}`}</span>}
        <span className="mxc-go">{`View ${noun} →`}</span>
      </span>
    </a>}
  </C.Provider>;
}

/** `text` with its product mentions linked, as nodes. Call it in the card's own render with the card's own `seen` set (first
 *  mention per card): a child component would add to the set twice under React's double render in development. */
export function mentionNodes(m: Ctx | null, text: string, seen: Set<string>): ReactNode {
  if (!m) return text;
  return splitMentions(text, m.index, m.selfId, seen).map((s, i) => s.id && m.targets[s.id]
    ? <a key={i} className="mx" href={m.targets[s.id]!.href} onMouseEnter={e => m.show(s.id!, e.currentTarget)} onMouseLeave={m.hide} onFocus={e => m.show(s.id!, e.currentTarget)} onBlur={m.hide}>{s.t}</a>
    : <span key={i}>{s.t}</span>);
}

/** The products a "Compared to" text names, as small chips with a thumbnail, then a side-by-side link for the first one. */
export function MentionChips({ text }: { text: string }) {
  const m = useMentions();
  if (!m) return null;
  const ids = splitMentions(text, m.index, m.selfId, new Set()).filter(s => s.id && m.targets[s.id]).map(s => s.id!);
  if (!ids.length) return null;
  const first = m.targets[ids[0]!]!;
  return <span className="mx-chips">
    {ids.map(id => { const t = m.targets[id]!;
      return <a key={id} className="mx-chip" href={t.href} onMouseEnter={e => m.show(id, e.currentTarget)} onMouseLeave={m.hide}>
        {t.pic ? <img src={t.pic} alt="" width={18} height={24} loading="lazy"/> : null}<span>{t.name}</span></a>; })}
    {m.compareHref && <a className="mx-cmp" href={m.compareHref(m.selfSlug, first.slug)}>{"Compare side by side →"}</a>}
  </span>;
}
