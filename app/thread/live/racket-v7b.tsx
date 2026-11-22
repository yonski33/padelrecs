"use client";
// PadelRecs' racket page, v7b (owner design 2026-11-20, design_handoff_padel_product_v7b): "Is it right for me?" and the poll
// as their own cards, the reviews as divided rows (name · pill · date, text, ▲ helpful · source · original ↗, ⋯ menu) with
// plain source tabs and a Sort menu. Same data and the same posting, voting and owner tools as racket.tsx; other sites keep
// racket.tsx's Reviews. Helpful votes: /api/helpful (review_votes, already live; counts come with the page).
import { HelpfulEditor } from "./helpful-admin";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { accountSite } from "../../../lib/thread/sites";
import { niche } from "../../../lib/niche";
import { th } from "../../../lib/thread/look";
import { W } from "../../../lib/thread/words";
import { nameProblem, NAME_MAX, subreddit } from "../../../lib/thread/display-name";
import { VERDICTS, type Verdict } from "../../quick-vote";
import { tone, VERDICT } from "../ui";
import { Ago } from "./ago";
import { PickChips } from "./pick-chips";
import { usePicks, usePayload, complete, fitFor, adviceFor } from "./picks";
import { FIT_HEAD, Poll, postWhy, useReviewPost } from "./racket";
import { PendingReviews, useOwner, status, editText, editName, send } from "./review-admin";
import { grow } from "./name";
import { signInHref } from "./use-account";
import { MemberMark } from "./member-mark";
import { avatarOf } from "../../../lib/thread/avatar";
import type { RvCard } from "../racket-data";
import { countLine, isThin, playersWord, POLL_POINT_MIN, threadTitle, thumbOf, WEB_FIRST, webList, type WebGroups } from "../../../lib/thread/web-sources";

const ACCOUNTS = accountSite(niche.id);
/** The event the poll sends to open the review form (v16 "Say why in a short review"). */
export const OPEN_REVIEW = "thread-open-review";

/** "Is it right for me?": the same picks and engine as FitCheck, with the bigger match box. `part`: a section of the top card
 *  (owner 2026-11-21: one card, as on PickleballRecs) instead of its own card. */
/** `title`/`sub`: the racket page's own heading and line (owner mock 2026-11-21, "Is this racket right for me?"). */
export function FitCard({ id, part, title = W.fitTitle, sub, arm = "Arm comfort" }: { id: string; part?: boolean; title?: string; sub?: string; /** The check's label (SimRacingRecs: "I race on console"). */ arm?: string }) {
  const [picks, set] = usePicks();
  const on = complete(picks), payload = usePayload(on);
  const fit = useMemo(() => on && payload ? fitFor(payload, picks, id) : null, [on, payload, picks, id]);
  const adv = useMemo(() => fit && payload && fit.verdict.kind !== "thin" ? adviceFor(payload, picks, id, fit.pct) : null, [fit, payload, picks, id]);
  return <section className={part ? "th7-part th7-fit" : "th-card th7-card th7-fit"}>
    {sub ? <div className="th7-hd"><h2 className="th-h2">{title}</h2><span className="th-sub">{sub}</span></div> : <h2 className={part ? "th7-subh" : "th-h3"}>{title}</h2>}
    <div className="th-fit"><PickChips picks={picks} set={set} small armLabel={arm} {...(sub ? { labels: ["Your level", "What matters most?"] as [string, string] } : {})}/></div>
    {(picks.level || picks.style) && <div aria-live="polite">
      {!on ? <p className="th-note">Pick a level and a style to see your match.</p> : !fit ? <p className="th-note">Working out your match…</p>
        : <div className="th7-match">
          {fit.pct != null && <span className="th7-match-pct"><span className={`th-badge ${tone(fit.pct)}`}>{`${fit.pct}%`}</span><small>your match</small></span>}
          <span className="th7-match-body"><b>{FIT_HEAD[fit.verdict.kind]}</b>
            {adv ? <>
              <span>{adv.line}</span>
              {adv.better.length > 0 && <span className="th-fit-better">{"Better for you: "}{adv.better.map((b, i) => <span key={b.id}>{i > 0 && " or "}<a href={th(b.href)}>{b.name}</a>{` (${b.pct}%)`}</span>)}.</span>}
            </> : fit.verdict.reasons.length > 0 && <span>{fit.verdict.reasons.slice(0, 2).join(" ")}</span>}
          </span>
        </div>}
    </div>}
  </section>;
}

/** The "Would you buy it again?" poll as its own card (the same Poll and votes). */
export function PollCard({ part, ...p }: Parameters<typeof Poll>[0] & { part?: boolean }) {
  return <section className={part ? "th7-part th7-poll" : "th-card th7-card th7-poll"}><Poll {...p}/></section>;
}

// ⋯ menu: Report for everyone (reviews also Copy link); the owner's tools after a thin divider (the shared owner check,
// app/admin-edit.tsx, the same role the page's other owner tools use; every action is checked again on the server).
export type MenuItem = { label: string; run: () => void; danger?: boolean };
export function MoreMenu({ items, owner = [] }: { items: MenuItem[]; owner?: MenuItem[] }) {
  const [open, setOpen] = useState(false), ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (!open) return;
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", off); return () => document.removeEventListener("click", off); }, [open]);
  const btn = (m: MenuItem) => <button key={m.label} type="button" className={m.danger ? "danger" : undefined} onClick={() => { setOpen(false); m.run(); }}>{m.label}</button>;
  return <span className="th7-more" ref={ref}>
    {open && <span className="th7-more-items">{items.map(btn)}{owner.length > 0 && <span className="th7-more-own">{owner.map(btn)}</span>}</span>}
    <button type="button" className="th7-dots" aria-label="More actions" aria-expanded={open} onClick={() => setOpen(o => !o)}>⋯</button>
  </span>;
}
/** Report goes to the contact form with the post's link filled in (app/thread/live/contact.tsx reads ?report=). */
export const reportPost = (anchor: string) => {
  const link = `${location.origin}${location.pathname}#${anchor}`;
  location.href = th(`/contact?report=${encodeURIComponent(link)}`);
};

const MINE_KEY = "th-helpful";
const readMine = (): Record<string, true> => { try { return JSON.parse(localStorage.getItem(MINE_KEY) || "{}"); } catch { return {}; } };
/** "▲ n helpful": tap to add, tap again to undo (one per device on the server, remembered here so the tap shows as yours). */
function Helpful({ c }: { c: RvCard }) {
  const type = c.kind === "player" ? "player" : "web", rid = c.id.slice(2), key = `${type}:${rid}`;
  const [mine, setMine] = useState(false), [n, setN] = useState(c.helpful), [busy, setBusy] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMine(!!readMine()[key]); }, [key]);
  if (rid.startsWith("demo-")) return null;
  const tap = async () => {
    if (busy) return; const on = !mine; setBusy(true); setMine(on); setN(x => Math.max(0, x + (on ? 1 : -1)));
    try {
      const r = await fetch("/api/helpful", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id: rid, on }) });
      const b = await r.json() as { count?: number };
      if (!r.ok || typeof b.count !== "number") throw new Error();
      setN(b.count);
      try { const m = readMine(); if (on) m[key] = true; else delete m[key]; localStorage.setItem(MINE_KEY, JSON.stringify(m)); } catch {}
    } catch { setMine(!on); setN(c.helpful); } finally { setBusy(false); }
  };
  return <button type="button" className="th7-help" aria-pressed={mine} onClick={tap}><span aria-hidden="true">▲</span>{n > 0 ? `${n} helpful` : "Helpful"}</button>;
}

// Muted outline icons (no brand colours): screen with play, face with antenna, page with folded corner.
const ICON: Record<Exclude<RvCard["kind"], "player">, ReactNode> = {
  youtube: <><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.2v5.6l4.6-2.8z"/></>,
  reddit: <><ellipse cx="12" cy="14.5" rx="8" ry="5.5"/><circle cx="18.5" cy="5" r="1.6"/><path d="M12 9l1.4-5 5.1 1"/><path d="M9.3 16.6c1.6 1 3.8 1 5.4 0"/></>,
  blog: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></>,
  forum: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></>,
};
const SRC_NAME = { youtube: "YouTube", reddit: "Reddit", blog: "Blog", forum: "Forum" } as const;
const LINK_WORD = { youtube: "Watch original ↗", reddit: "View original ↗", blog: "Read original ↗", forum: "Read original ↗" } as const;

export type Changed = { text?: string; alias?: string; gone?: true };
/** `flair`: the community feed's small REVIEW chip first (feed-v7b.tsx). */
export function ReviewRow({ c, owner, onChange, flair }: { c: RvCard; owner: boolean; onChange: (x: Changed) => void; flair?: boolean }) {
  const [helpEdit, setHelpEdit] = useState(false);
  const [edit, setEdit] = useState<{ name: string; text: string | null } | null>(null), [err, setErr] = useState(""), [copied, setCopied] = useState(false);
  const anchor = `rv-${c.id}`, rid = c.id.slice(2), web = c.kind !== "player";
  // Reddit rows: the subreddit, "r/name" (owner 2026-11-21; never "<model> owners"), else "Reddit".
  const name = c.kind === "reddit" ? subreddit(c.who) : c.who;
  // A player review with no typed name (owner 2026-11-21): "Player", then its level and side as the small grey tag.
  const shown = name || (c.kind === "player" ? "Player" : "");
  const run = async (f: () => Promise<void>, after: Changed) => { try { await f(); setErr(""); setEdit(null); onChange(after); } catch (e) { setErr(e instanceof Error ? e.message : "That didn't save."); } };
  const save = () => { if (!edit) return; const alias = c.alias ?? "";
    run(async () => { if (edit.name.trim() !== alias) await editName(rid, edit.name); if (edit.text !== null && edit.text.trim() !== c.text.trim()) await editText(rid, edit.text); },
      { ...(edit.name.trim() !== alias ? { alias: edit.name.trim() } : {}), ...(edit.text !== null ? { text: edit.text.trim() } : {}) }); };
  const copy = () => { const link = `${location.origin}${location.pathname}#${anchor}`;
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {}); };
  const tools = owner && !web && !rid.startsWith("demo-") ? [
    { label: "Edit", run: () => setEdit({ name: c.alias ?? "", text: c.text }) },
    { label: "Rename", run: () => setEdit({ name: c.alias ?? "", text: null }) },
    { label: "Hide", run: () => { if (window.confirm("Hide this review? It goes back to pending and leaves the score until approved again.")) run(() => status(rid, "pending", "approved"), { gone: true }); } },
    { label: "Delete", danger: true, run: () => { if (window.confirm("Delete this review for good? It can't be undone.")) run(async () => { await status(rid, "rejected", "approved"); await send("/api/funtimes/delete-rejected", { id: rid }); }, { gone: true }); } },
  ] : [];
  // The owner's Helpful clean-up (drizzle/0036): player reviews and web quotes alike.
  const helpTool = owner && !rid.startsWith("demo-") ? [{ label: "Edit helpful", run: () => setHelpEdit(true) }] : [];
  // v16: an initials avatar beside each review (grey and blank when the review has no name).
  const av = name ? avatarOf(name) : null;
  return <article id={anchor} className="th7-rv th7-rv-av">
    <span className={`th7-av${av ? "" : " none"}`} style={av ? { background: av.bg } : undefined} aria-hidden="true">{av?.init ?? ""}</span>
    <div className="th7-rv-b">
    <div className="th7-rv-top">{flair && <span className="th-flair review">Review</span>}{shown && <><strong>{shown}</strong>{c.member && <MemberMark/>}</>}{!name && c.info && <span className="th-rv-info">{c.info}</span>}
      {c.verdict && <span className={`th-vpill ${VERDICT[c.verdict][1]}`}>{VERDICT[c.verdict][0]}</span>}
      {/* DiscGolfRecs: the plastic the review is about (its variant chip, PR #256). Other sites' cards carry none. */}
      {c.version && <span className="th-pill">{c.version}</span>}
      {c.when && <span><Ago at={c.at || null} initial={c.when}/></span>}</div>
    {edit ? <div className="th-admin-acts">
      <span className="th-as" style={{ flexBasis: "100%" }}><input value={edit.name} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Reviewer's name" autoFocus={edit.text === null} onChange={e => { setEdit({ ...edit, name: e.target.value }); setErr(""); }}/></span>
      {edit.text !== null && <textarea className="th-ta" rows={4} value={edit.text} maxLength={4000} aria-label="Edit review" onChange={e => setEdit({ ...edit, text: e.target.value })}/>}
      <button type="button" className="th-btn dark" onClick={save}>{edit.text === null ? "Save name" : "Save"}</button>
      <button type="button" className="th-btn" onClick={() => { setEdit(null); setErr(""); }}>Cancel</button>
    </div> : <p className={`th7-rv-text${c.quote ? " quote" : ""}`}>{c.quote ? `“${c.text}”` : c.text}</p>}
    {err && <span className="th-err" role="alert">{err}</span>}
    <div className="th7-rv-foot">
      <Helpful c={c}/>
      {web && <><span className="sep">·</span><span className="th7-src"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[c.kind as keyof typeof ICON]}</svg>
        {`${SRC_NAME[c.kind as keyof typeof SRC_NAME]} · ${c.quote ? "Quoted" : "Summarised"}`}</span>
        {c.url && <><span className="sep">·</span><a href={c.url} target="_blank" rel="noopener nofollow">{LINK_WORD[c.kind as keyof typeof LINK_WORD]}</a></>}</>}
      {copied && <span className="th7-copied" role="status">Link copied</span>}
      <MoreMenu items={[{ label: "Copy link", run: copy }, { label: "Report", run: () => reportPost(anchor) }]} owner={[...tools, ...helpTool]}/>
    </div>
    {helpEdit && <HelpfulEditor kind={web ? "web" : "player"} id={rid} onClose={() => setHelpEdit(false)}/>}
    </div>
  </article>;
}

// Owner mock 2026-11-21: sentiment chips and Newest · Most helpful · Oldest. Only the site's own reviews are listed here;
// outside sources have their own section below (WebSources), so there are no source chips.
const FEEL = [["all", "All"], ["positive", "Loved it"], ["mixed", "Mixed"], ["negative", "Not for me"]] as const;
type Sort = "helpful" | "new" | "old";
const SORTS: [Sort, string][] = [["new", "Newest"], ["helpful", "Most helpful"], ["old", "Oldest"]];
const PAGE = 8;
/** Player reviews (v7b). `model` (the racket's name without brand and year) is no longer shown here. */
/** The poll's live total, as the poll itself shows it (racket.tsx Poll sends it once its counts load). */
export const POLL_TOTAL = "thread-poll-total";
export function PollPointer() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => { const w = window as { __thPollTotal?: number }; if (typeof w.__thPollTotal === "number") setN(w.__thPollTotal);
    const on = (e: Event) => setN((e as CustomEvent<number>).detail); addEventListener(POLL_TOTAL, on); return () => removeEventListener(POLL_TOTAL, on); }, []);
  return n != null && n >= POLL_POINT_MIN ? <a className="th7-pollpoint" href="#feedback">{`${n.toLocaleString("en-US")} ${W.people} voted in the poll above`}</a> : null;
}

/** Player reviews (v7b). Under THIN_REVIEWS (lib/thread/web-sources.ts) a compact strip: any reviews, an invitation, the
 *  + Add your review button and a pointer to the poll; no sort or filter chips. `web`: how many outside summaries follow. */
export function ReviewsV7b({ id, cards, web = 0 }: { id: string; cards: RvCard[]; web?: number; model?: string }) {
  const { open, setOpen, verdict, setVerdict, text, setText, nick, setNick, busy, error, setError, done, me, post } = useReviewPost(id);
  // v16: "Say why in a short review" under a poll vote opens the form here with that vote picked.
  useEffect(() => { const on = (e: Event) => { const v = (e as CustomEvent<Verdict>).detail; setOpen(true); if (v) setVerdict(v);
    setTimeout(() => document.getElementById("reviews")?.scrollIntoView({ block: "start", behavior: "smooth" }), 30); };
    addEventListener(OPEN_REVIEW, on); return () => removeEventListener(OPEN_REVIEW, on); }, [setOpen, setVerdict]);
  const owner = useOwner();
  const [feel, setFeel] = useState<(typeof FEEL)[number][0]>("all"), [sort, setSort] = useState<Sort>("new"), [sortOpen, setSortOpen] = useState(false), [shown, setShown] = useState(PAGE);
  const [changed, setChanged] = useState<Record<string, Changed>>({});
  const live = useMemo(() => cards.filter(c => !changed[c.id]?.gone).map(c => { const x = changed[c.id]; return x ? { ...c, ...(x.text ? { text: x.text } : {}), ...(x.alias ? { who: x.alias, alias: x.alias, meta: null } : {}) } : c; }), [cards, changed]);
  // Tabs and sort run here in the browser (instant filters); "Most helpful" uses the page's vote counts, then longer text.
  const list = useMemo(() => {
    const l = live.filter(c => feel === "all" || c.verdict === feel);
    return [...l].sort((a, b) => sort === "helpful" ? b.helpful - a.helpful || b.text.length - a.text.length
      : sort === "old" ? (a.at ?? "").localeCompare(b.at ?? "") : (b.at ?? "").localeCompare(a.at ?? ""));
  }, [live, feel, sort]);
  // A link to one review (Copy link) opens on it: show enough rows and scroll there once the list is drawn.
  useEffect(() => { const h = location.hash.slice(1); if (!h.startsWith("rv-")) return; const i = list.findIndex(c => `rv-${c.id}` === h);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i >= shown) setShown(i + 1);
    setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "center" }), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sortLabel = SORTS.find(([k]) => k === sort)![1], thin = isThin(cards.length);
  const addBtn = !open && !done && <button type="button" className="th-btn round lime" onClick={() => setOpen(true)}>+ Add your review</button>;
  return <section id="reviews" className={`th-card th7-card th7-reviews${thin ? " thin" : ""}`}>
    <div className="th7-head"><h2 className="th-h2 th7-hic"><svg width="24" height="22" viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true"><path d="M15 3C8 3 3 7.3 3 12.5c0 2.6 1.3 5 3.4 6.7L5 25l6.3-3.2c1.2.3 2.4.5 3.7.5 7 0 12-4.3 12-9.8S22 3 15 3z"/></svg>{W.Reviews}</h2>
      <span className="th7-head-r">{!thin && <span className="th7-sort">
        <button type="button" className="th7-sort-btn" aria-haspopup="listbox" aria-expanded={sortOpen} onClick={() => setSortOpen(o => !o)}><span className="lbl">Sort:</span>{sortLabel}<span className="arr" aria-hidden="true">▼</span></button>
        {sortOpen && <span className="th7-sort-menu" role="listbox" aria-label="Sort reviews">{SORTS.map(([k, l]) =>
          <button key={k} type="button" role="option" aria-selected={sort === k} onClick={() => { setSort(k); setSortOpen(false); setShown(PAGE); }}>{l}<span>{sort === k ? "✓" : ""}</span></button>)}</span>}
      </span>}
      {!thin && addBtn}</span></div>
    <p className="th7-count">{countLine(cards.length, web, W.person)}</p>
    {done && <p className="th-ok" role="status">{done === "words" ? "Thanks for sharing! Your review will appear here once it's approved." : done === "live" ? "Thanks for sharing! Your review is live and shows here after a refresh." : "Thanks! Your vote has been added."}</p>}
    {open && <div className="th-compose soft">
      {me ? <div className="th-as th-as-me">Posting as <b>{me.name}</b><MemberMark/></div>
        : <div className="th-as"><input value={nick} onChange={e => { setNick(e.target.value); setError(""); }} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Name or nickname" required/></div>}
      <div className="th-picks"><span className="lbl" style={{ fontSize: 13.5, color: "var(--ink2)", minWidth: 0 }}>{W.triedIt}</span>
        {VERDICTS.map(v => <button key={v.key} type="button" className={`th-vpick ${VERDICT[v.key][1]}`} aria-pressed={verdict === v.key} onClick={() => { setVerdict(v.key as Verdict); setError(""); }}><span className={`th-sdot ${VERDICT[v.key][1]}`}/>{VERDICT[v.key][0]}</button>)}
      </div>
      <textarea className="th-ta th-ta-grow" rows={3} autoFocus value={text} onChange={e => { setText(e.target.value); setError(""); grow(e.currentTarget, 240); }} maxLength={2000} placeholder="Write your review" aria-label="Your review"/>
      {error && <span className="th-err">{error}</span>}
      <div className="th-compose-foot"><span className="th-grow"/>{me || !ACCOUNTS ? null : <a className="th-signin" href={signInHref("#reviews")}>Sign in to keep your name</a>}
        <button type="button" className="cancel" onClick={() => { setOpen(false); setError(""); }}>Cancel</button>
        <button type="button" className="th-post" disabled={!verdict || busy || (!!text.trim() && !!nameProblem(nick))} onClick={post}>{busy ? "Posting…" : "Post"}</button></div>
      {!busy && postWhy(verdict, text, nick) && <span className="th-why" style={{ alignSelf: "flex-end" }}>{postWhy(verdict, text, nick)}</span>}
    </div>}
    <PendingReviews racketId={id}/>
    {!thin && <div className="th7-bar th7-chips">
      <div className="th7-chipset" role="group" aria-label="Show reviews that">{FEEL.map(([k, l]) =>
        <button key={k} type="button" aria-pressed={feel === k} onClick={() => { setFeel(k); setShown(PAGE); }}>{l}</button>)}</div>
    </div>}
    <div className="th7-rv-list">
      {list.slice(0, shown).map(c => <ReviewRow key={c.id} c={c} owner={owner} onChange={x => setChanged(m => ({ ...m, [c.id]: { ...m[c.id], ...x } }))}/>)}
      {cards.length > 0 && list.length === 0 && <p className="th-empty">No reviews match these filters yet. <button type="button" onClick={() => setFeel("all")}>Show all</button></p>}
    </div>
    {thin && <div className="th7-invite">
      <span>{cards.length === 0 ? `No ${W.person} reviews yet. ${W.usedIt} Add the first one` : `${W.usedIt} Add yours`}</span>
      {addBtn}<PollPointer/></div>}
    {list.length > shown && <button type="button" className="th-btn th-center" style={{ margin: "4px 0 8px" }} onClick={() => setShown(s => s + 16)}>Show more reviews</button>}
  </section>;
}

/** One outside source's card: where and when, the overall feel, then the summary in the site's words and a link out. */
function WebCard({ c, kind }: { c: RvCard; kind: keyof WebGroups<RvCard> }) {
  const thumb = kind === "videos" ? thumbOf(c.url) : null, title = kind === "threads" ? threadTitle(c.url) : null;
  const where = c.kind === "reddit" ? subreddit(c.who) : c.who;
  const link = c.url && <a className="th-web-go" href={c.url} target="_blank" rel="noopener nofollow">{WEB_LINK[kind]}</a>;
  const inThread = kind === "comments" ? threadTitle(c.url) : null;
  return <article id={`rv-${c.id}`} className={`th-web-c${thumb ? " vid" : ""}`}>
    {thumb && <a className="th-web-th" href={c.url!} target="_blank" rel="noopener nofollow" tabIndex={-1} aria-hidden="true">
      <img src={thumb} alt="" loading="lazy" width={320} height={180}/><span className="play"/></a>}
    <div className="th-web-b">
      <div className="th-web-meta"><span className={`th-web-src ${WEB_SRC[kind][1]}`}>{WEB_SRC[kind][0]}</span><b>{where}</b>{c.when && <><span>·</span><Ago at={c.at || null} initial={c.when}/></>}
        {c.verdict && <span className={`th-vpill ${VERDICT[c.verdict][1]}`}>{VERDICT[c.verdict][0]}</span>}{c.version && <span className="th-pill">{c.version}</span>}</div>
      {title && <strong className="th-web-t">{title}</strong>}
      <p className="th-web-x">{playersWord(c.text, W.person)}</p>
      {inThread ? <span className="th-web-in">{`in “${inThread}” `}{link}</span> : link}
    </div>
  </article>;
}
const WEB_LINK = { threads: "Read the thread ↗", videos: "Watch on YouTube ↗", comments: "View on Reddit ↗", blogs: "Read the post ↗" } as const;
/** The small source badge each card starts with. */
const WEB_SRC = { threads: ["r/ Reddit", "r"], comments: ["r/ Reddit", "r"], videos: ["▶ YouTube", "yt"], blogs: ["Blog", "bl"] } as const;

/** "From around the web" (owner mock 2026-11-21; one list since the owner's follow-up): the outside sources in a dashed box
 *  apart from the player reviews, newest first across sources, in two evenly filled columns on desktop (CSS columns, so no
 *  holes) and one on phones. `open` (under THIN_REVIEWS player reviews): every card; else WEB_FIRST, then one Show more.
 *  None of it counts in the poll. */
export function WebSources({ web, open = false }: { web: WebGroups<RvCard>; open?: boolean }) {
  // `open` can turn off once the community feed's posts load (feed-v7b.tsx), so it is read live, not just at first render.
  const [more, setAll] = useState(false), all = open || more;
  // A copied link to one card (#rv-w-…) opens the box on it.
  useEffect(() => { const h = location.hash.slice(1); if (!h.startsWith("rv-w-")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAll(true); setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "center" }), 50); }, []);
  const list = useMemo(() => webList(web), [web]);
  if (!list.length) return null;
  return <section id="web" className="th-card th-web">
    <h2 className="th-h2">From around the web</h2>
    <p className="th-web-sub">{`Short summaries of Reddit threads, YouTube reviews and blogs. Not counted in the ${W.person} poll above.`}</p>
    {/* No count line (owner 2026-11-21): the subline and the tag only. */}<span className="th-web-tag">Outside sources</span>
    <div className="th-web-cols">{(all ? list : list.slice(0, WEB_FIRST)).map(({ c, kind }) => <WebCard key={c.id} c={c} kind={kind}/>)}</div>
    {!all && list.length > WEB_FIRST && <button type="button" className="th-btn th-center" onClick={() => setAll(true)}>Show more from around the web</button>}
  </section>;
}
