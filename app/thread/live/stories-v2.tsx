"use client";
// PadelRecs Stories, the owner's design (2026-11-21, design_handoff_padel_stories): the list's topic tabs, Sort menu, rows
// and Load more, and the story page's action row (▲, comments, Share, ⋯). Filters and sorting run here on the cached list
// (no request per tap). ▲ is for signed-in members (drizzle/0033); the counts come with the cached page, and which stories
// are yours is asked in the browser, once, only when a session cookie is there.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { th } from "../../../lib/thread/look";
import { STORY_TOPICS, topicLabel, type StoryTopic } from "../../../lib/thread/stories";
import { Ago } from "./ago";
import { MemberMark } from "./member-mark";
import { MoreMenu, reportPost, type MenuItem } from "./racket-v7b";
import { signInHref } from "./use-account";

export type StoryItem = { id: string; slug: string; title: string; excerpt: string; who: string; init: string; bg: string; level: string | null;
  at: string; ago: string; topic: StoryTopic | null; racket: { name: string; href: string } | null; likes: number; comments: number; read: number };

const signedIn = () => typeof document !== "undefined" && /(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
let likedCheck: Promise<Set<string>> | null = null;
/** The stories this member has ▲'d, and a toggle that saves it (signs guests in first). */
export function useLikes(on: boolean) {
  // `base`: what the server said when the page loaded; the cached ▲ counts most likely hold those already.
  const [mine, setMine] = useState<Set<string>>(new Set()), [base, setBase] = useState<Set<string>>(new Set()), [err, setErr] = useState("");
  useEffect(() => {
    if (!on || !signedIn()) return;
    let live = true;
    likedCheck ??= fetch("/api/stories/like", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { liked?: string[] } | null) => new Set(b?.liked ?? [])).catch(() => new Set<string>());
    likedCheck.then(s => { if (live) { setMine(new Set(s)); setBase(new Set(s)); } });
    return () => { live = false; };
  }, [on]);
  async function toggle(id: string) {
    if (!signedIn()) { location.href = signInHref(); return; }
    const was = mine.has(id), next = new Set(mine);
    if (was) next.delete(id); else next.add(id);
    setMine(next); setErr("");
    const r = await fetch("/api/stories/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, on: !was }) }).catch(() => null);
    if (r?.ok) return;
    const b = await r?.json().catch(() => null) as { error?: string } | null;
    if (r?.status === 401 || r?.status === 403) { location.href = signInHref(); return; }
    setMine(new Set(mine)); setErr(b?.error ?? "Could not save that. Try again?");
  }
  /** The cached count with this visitor's taps since the page loaded (never under 0). */
  const count = (id: string, n: number) => Math.max(0, n + (mine.has(id) ? 1 : 0) - (base.has(id) ? 1 : 0));
  return { mine, toggle, count, err };
}

const SORTS = [["new", "Latest"], ["liked", "Most liked"], ["discussed", "Most discussed"]] as const;
type Sort = typeof SORTS[number][0];
const PAGE = 10;

/** `hero`: the top card's words and button (server-rendered); the tabs and Sort sit under them, as in the design. */
export function StoryList({ items, likesOn, hero }: { items: StoryItem[]; likesOn: boolean; hero: ReactNode }) {
  const [topic, setTopic] = useState<StoryTopic | "all">("all"), [sort, setSort] = useState<Sort>("new"), [open, setOpen] = useState(false), [shown, setShown] = useState(PAGE);
  const likes = useLikes(likesOn), sortRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (!open) return;
    const off = (e: MouseEvent) => { if (!sortRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", off); return () => document.removeEventListener("click", off); }, [open]);
  // Only topics that have a story get a tab, and the tabs show once any story has a topic.
  const tabs = useMemo(() => STORY_TOPICS.filter(t => items.some(s => s.topic === t[0])), [items]);
  const sorts = SORTS.filter(([k]) => k !== "liked" || likesOn);
  const list = useMemo(() => items.filter(s => topic === "all" || s.topic === topic).map((s, i) => ({ s, i }))
    .sort((a, b) => sort === "liked" ? b.s.likes - a.s.likes || a.i - b.i : sort === "discussed" ? b.s.comments - a.s.comments || a.i - b.i : a.i - b.i).map(x => x.s), [items, topic, sort]);
  const label = SORTS.find(x => x[0] === sort)![1];
  return <>
    <section className="th-card ths-hero">{hero}
    {(tabs.length > 0 || items.length > 1) && <div className="ths-bar">
      {tabs.length > 0 && <div className="th7-tabs" role="group" aria-label="Topics">
        {[["all", "All"] as const, ...tabs.map(t => [t[0], t[2]] as const)].map(([k, l]) => <button key={k} type="button" aria-pressed={topic === k} onClick={() => { setTopic(k); setShown(PAGE); }}>{l}</button>)}
      </div>}
      {items.length > 1 && <span className="th7-sort" ref={sortRef}>
        <button type="button" className="th7-sort-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(o => !o)}><span className="lbl">Sort:</span>{label}<span className="arr" aria-hidden="true">▼</span></button>
        {open && <span className="th7-sort-menu" role="listbox" aria-label="Sort stories">{sorts.map(([k, l]) => <button key={k} type="button" role="option" aria-selected={sort === k}
          onClick={() => { setSort(k); setOpen(false); setShown(PAGE); }}>{l}<span aria-hidden="true">{sort === k ? "✓" : ""}</span></button>)}</span>}
      </span>}
    </div>}
    </section>
    <section className="th-card ths-list">
      {list.length === 0 && <p className="th-note" style={{ padding: "14px 0" }}>No stories here yet.</p>}
      {list.slice(0, shown).map(s => {
        const n = likes.count(s.id, s.likes), href = th(`/stories/${s.slug}`);
        return <article key={s.id} className="ths-row">
          <div className="ths-by"><span className="th7-av xs" style={{ background: s.bg }} aria-hidden="true">{s.init}</span><strong>{s.who}</strong><MemberMark/>
            {s.level && <span>{s.level}</span>}<span>{"· "}<Ago at={s.at} initial={s.ago}/></span></div>
          <a className="ths-title" href={href}>{s.title}</a>
          <p className="ths-ex">{s.excerpt}</p>
          <div className="ths-meta">
            {s.topic && <span className="ths-topic">{topicLabel(s.topic)}</span>}
            {s.racket && <a className="ths-racket" href={th(s.racket.href)}>{s.racket.name}</a>}
            {likesOn && <button type="button" className="th7-up" aria-pressed={likes.mine.has(s.id)} aria-label={`Like ${s.title}`} onClick={() => likes.toggle(s.id)}><span aria-hidden="true">▲</span>{n > 0 ? n : ""}</button>}
            <a className="ths-cm" href={`${href}#discussion`}>{s.comments > 0 ? `${s.comments} ${s.comments === 1 ? "comment" : "comments"}` : "Comment"}</a>
            <span>{`${s.read} min read`}</span>
          </div>
        </article>;
      })}
      {likes.err && <span className="th-err" role="alert">{likes.err}</span>}
      {list.length > shown && <button type="button" className="ths-more" onClick={() => setShown(n => n + PAGE)}>Load more stories</button>}
    </section>
  </>;
}

/** The story page's action row: ▲ (lime when yours), comments (jumps to the discussion), Share (copies the link), ⋯ (Report;
 *  for its author or an admin Edit and Delete; for an admin Hide too). Who may edit is asked in the browser (/api/stories?can=),
 *  so the cached page is the same for everyone. */
export function StoryActions({ id, slug, likes: n0, comments, likesOn }: { id: string; slug: string; likes: number; comments: number; likesOn: boolean }) {
  const likes = useLikes(likesOn);
  const [can, setCan] = useState<{ edit: boolean; admin: boolean }>({ edit: false, admin: false }), [shared, setShared] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    if (!signedIn()) return;
    let live = true;
    fetch(`/api/stories?can=${encodeURIComponent(slug)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null)
      .then((b: { canEdit?: boolean; admin?: boolean } | null) => { if (live) setCan({ edit: !!b?.canEdit, admin: !!b?.admin }); }).catch(() => {});
    return () => { live = false; };
  }, [slug]);
  async function share() {
    const url = `${location.origin}${location.pathname}`;
    try { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2500); } catch { window.prompt("Copy this link", url); }
  }
  async function act(kind: "hide" | "delete") {
    if (busy || !window.confirm(kind === "hide" ? "Hide this story? It moves to Rejected in the admin Stories tab." : "Delete this story and its comments for good?")) return;
    setBusy(true); setError("");
    const r = kind === "hide" ? await fetch("/api/stories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, hide: true }) }).catch(() => null)
      : await fetch(`/api/stories?id=${id}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) { window.location.href = th("/stories"); return; }
    setError(kind === "hide" ? "Could not hide that. Try again?" : "Could not delete that. Try again?"); setBusy(false);
  }
  const own: MenuItem[] = [...(can.edit ? [{ label: "Edit", run: () => { location.href = th(`/stories/${slug}/edit`); } }] : []),
    ...(can.admin ? [{ label: "Hide", run: () => act("hide") }] : []), ...(can.edit ? [{ label: "Delete", danger: true, run: () => act("delete") }] : [])];
  const n = likes.count(id, n0), mine = likes.mine.has(id);
  return <>
    <div className="ths-actions">
      {likesOn && <button type="button" className="ths-act like" aria-pressed={mine} aria-label="Like this story" onClick={() => likes.toggle(id)}>{`▲ ${n > 0 ? n : "Like"}`}</button>}
      <a className="ths-act" href="#discussion">{comments > 0 ? `${comments} ${comments === 1 ? "comment" : "comments"}` : "Comment"}</a>
      <button type="button" className="ths-act" onClick={share} aria-live="polite">{shared ? "Link copied" : "Share"}</button>
      <MoreMenu items={[{ label: "Report", run: () => reportPost("story") }]} owner={own}/>
    </div>
    {(error || likes.err) && <span className="th-err" role="alert">{error || likes.err}</span>}
  </>;
}
