"use client";
// PadelRecs Stories v3 (owner design 2026-11-21, design_handoff_padelrecs_v3): the list's topic pills, Featured card, sort
// pills, rows with a △ / comments box, Load more and the sidebar (Got a story?, Popular this month, Topics); and the story
// page's action row (△ Helpful, Share, comments ↓, ⋯). Filters and sorting run here on the cached list
// (no request per tap). ▲ is for signed-in members (drizzle/0033); the counts come with the cached page, and which stories
// are yours is asked in the browser, once, only when a session cookie is there.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { th } from "../../../lib/thread/look";
import { STORY_TOPICS, topicLabel, type StoryTopic } from "../../../lib/thread/stories";
import { Ago } from "./ago";
import { MemberMark } from "./member-mark";
import { MoreMenu, reportPost, type MenuItem } from "./racket-v7b";
import { signInHref } from "./use-account";

export type StoryItem = { id: string; slug: string; title: string; excerpt: string; who: string; init: string; bg: string; level: string | null;
  at: string; ago: string; topic: StoryTopic | null; featured: string | null; likes: number; comments: number; read: number };

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

const PAGE = 10;
const comments = (n: number) => `${n} ${n === 1 ? "comment" : "comments"}`;

/** The list page's whole body: hero (server words + topic pills), Featured, the list, and the sidebar. */
export function StoryList({ items, likesOn, hero, side }: { items: StoryItem[]; likesOn: boolean; hero: ReactNode; side: ReactNode }) {
  const [topic, setTopic] = useState<StoryTopic | "all">("all"), [sort, setSort] = useState<"new" | "top">("new"), [shown, setShown] = useState(PAGE);
  const likes = useLikes(likesOn);
  // Only topics that have a story get a pill, and the pills show once any story has a topic (drizzle/0033).
  const tabs = useMemo(() => STORY_TOPICS.filter(t => items.some(s => s.topic === t[0])), [items]);
  const pick = (k: StoryTopic | "all") => { setTopic(k); setShown(PAGE); };
  // The newest featured story leads "All" (the owner features one from its ⋯ menu); none featured, no card.
  const feat = topic === "all" ? items.filter(s => s.featured).sort((a, b) => (b.featured ?? "").localeCompare(a.featured ?? ""))[0] ?? null : null;
  const list = useMemo(() => items.filter(s => s !== feat && (topic === "all" || s.topic === topic)).map((s, i) => ({ s, i }))
    .sort((a, b) => sort === "top" ? b.s.likes - a.s.likes || a.i - b.i : a.i - b.i).map(x => x.s), [items, topic, sort, feat]);
  const by = (s: StoryItem) => <><strong>{s.who}</strong><MemberMark/></>;
  const tlabel = topic === "all" ? null : STORY_TOPICS.find(t => t[0] === topic)![2];
  return <>
    <section className="th-card ths3-hero">{hero}
      {tabs.length > 0 && <div className="ths3-pills" role="group" aria-label="Topics">
        {[["all", "All"] as const, ...tabs.map(t => [t[0], t[2]] as const)].map(([k, l]) => <button key={k} type="button" aria-pressed={topic === k} onClick={() => pick(k)}>{l}</button>)}
      </div>}
    </section>
    <div className="ths3-grid">
      <div className="ths3-main">
        {feat && <a className="th-card ths3-feat" href={th(`/stories/${feat.slug}`)}>
          <span className="tags"><span className="dark">Featured</span>{feat.topic && <span>{topicLabel(feat.topic)}</span>}</span>
          <strong className="t">{feat.title}</strong>
          <span className="ex">{feat.excerpt}</span>
          <span className="by"><span className="th7-av" style={{ background: feat.bg }} aria-hidden="true">{feat.init}</span>{by(feat)}
            <span>{`· ${feat.read} min read · ${comments(feat.comments)}${likesOn ? ` · △ ${likes.count(feat.id, feat.likes)}` : ""}`}</span></span>
        </a>}
        <section className="th-card ths3-list">
          <div className="ths3-list-head"><h2 className="th-h2">{tlabel ? `${tlabel} stories` : "Latest stories"}</h2>
            {likesOn && list.length > 1 && <span className="ths3-sort" role="group" aria-label="Sort stories">{([["new", "Newest"], ["top", "Most upvoted"]] as const).map(([k, l]) =>
              <button key={k} type="button" aria-pressed={sort === k} onClick={() => { setSort(k); setShown(PAGE); }}>{l}</button>)}</span>}</div>
          {list.length === 0 && <p className="ths3-none">{feat ? "No other stories yet." : "No stories in this topic yet. Be the first to share one."}</p>}
          {list.slice(0, shown).map(s => <a key={s.id} className="ths3-row" href={th(`/stories/${s.slug}`)}>
            <span className="words">
              {s.topic && <span className="ths3-topic">{topicLabel(s.topic)}</span>}
              <strong className="t">{s.title}</strong>
              <span className="ex">{s.excerpt}</span>
              <span className="by">{by(s)}<span>{"· "}<Ago at={s.at} initial={s.ago}/>{` · ${s.read} min read`}</span></span>
            </span>
            <span className="stat">{likesOn && <b>{`△ ${likes.count(s.id, s.likes)}`}</b>}<span>{comments(s.comments)}</span></span>
          </a>)}
          {list.length > shown && <button type="button" className="ths3-more" onClick={() => setShown(n => n + PAGE)}>Load more stories</button>}
        </section>
      </div>
      <aside className="ths3-side">{side}
        {tabs.length > 0 && <section className="th-card ths3-box"><h3>Topics</h3>
          {tabs.map(t => <button key={t[0]} type="button" className="ths3-tc" onClick={() => { pick(t[0]); window.scrollTo({ top: 0 }); }}>
            <span>{t[2]}</span><span>{items.filter(s => s.topic === t[0]).length}</span></button>)}
        </section>}
      </aside>
    </div>
  </>;
}

/** The story page's action row: △ Helpful (yours shows lime), Share (copies the link), comments ↓, and ⋯ (Report; Edit and
 *  Delete for its author or an admin; Feature and Hide for an admin). Who may edit is asked in the browser
 *  (/api/stories?can=), so the cached page is the same for everyone. */
export function StoryActions({ id, slug, likes: n0, comments: cm, likesOn, featured, canFeature }: { id: string; slug: string; likes: number; comments: number; likesOn: boolean; featured: boolean; canFeature: boolean }) {
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
  async function act(kind: "hide" | "delete" | "feature") {
    const ask = kind === "hide" ? "Hide this story? It moves to Rejected in the admin Stories tab." : kind === "delete" ? "Delete this story and its comments for good?" : null;
    if (busy || (ask && !window.confirm(ask))) return;
    setBusy(true); setError("");
    const patch = (b: object) => fetch("/api/stories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).catch(() => null);
    const r = kind === "hide" ? await patch({ id, hide: true }) : kind === "feature" ? await patch({ id, feature: !featured })
      : await fetch(`/api/stories?id=${id}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) { window.location.href = kind === "feature" ? location.pathname : th("/stories"); return; }
    setError(kind === "hide" ? "Could not hide that. Try again?" : kind === "feature" ? "Could not save that. Try again?" : "Could not delete that. Try again?"); setBusy(false);
  }
  const own: MenuItem[] = [...(can.edit ? [{ label: "Edit", run: () => { location.href = th(`/stories/${slug}/edit`); } }] : []),
    ...(can.admin && canFeature ? [{ label: featured ? "Unfeature" : "Feature", run: () => act("feature") }] : []),
    ...(can.admin ? [{ label: "Hide", run: () => act("hide") }] : []), ...(can.edit ? [{ label: "Delete", danger: true, run: () => act("delete") }] : [])];
  const n = likes.count(id, n0), mine = likes.mine.has(id);
  return <>
    <div className="ths3-actions">
      {likesOn && <button type="button" className="ths3-act" aria-pressed={mine} onClick={() => likes.toggle(id)}>{`△ Helpful · ${n}`}</button>}
      <button type="button" className="ths3-act" onClick={share} aria-live="polite">{shared ? "Link copied" : "Share"}</button>
      <a className="ths3-cm" href="#discussion">{`${comments(cm)} ↓`}</a>
      <MoreMenu items={[{ label: "Report", run: () => reportPost("story") }]} owner={own}/>
    </div>
    {(error || likes.err) && <span className="th-err" role="alert">{error || likes.err}</span>}
  </>;
}
