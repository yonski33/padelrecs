"use client";
// PadelRecs racket page, one community feed (owner OK 2026-11-21): "Players on the <model> (N)" lists the site's player
// reviews and the discussion's posts together, each with a REVIEW / QUESTION / TIP chip, All · Reviews · Questions · Tips
// chips and Newest activity · Top, in the browser (instant). One composer: Review opens the review form (Loved it / Mixed /
// Not for me), Question and Tip post to the discussion. Display only: reviews and posts stay in their own tables, reviews
// still feed the poll and the loved / mixed counts, posts never do. "From around the web" follows as its own section.
import { useEffect, useMemo, useState } from "react";
import { postTypeSite } from "../../../lib/thread/sites";
import { niche } from "../../../lib/niche";
import { W } from "../../../lib/thread/words";
import { accountSite, followSite } from "../../../lib/thread/sites";
import { FollowButton } from "./follow-button";
import { commenterName, nameProblem, NAME_MAX } from "../../../lib/thread/display-name";
import { mentionOf } from "../../../lib/thread/mention";
import { avatarOf } from "../../../lib/thread/avatar";
import { activity, FLAIR_WORD, guessedFlair, postFlair, REPLIES_SHOWN, type Flair } from "../../../lib/thread/feed";
import { isThin, type WebGroups } from "../../../lib/thread/web-sources";
import { VERDICTS, type Verdict } from "../../quick-vote";
import { ago, VERDICT } from "../ui";
import type { RvCard } from "../racket-data";
import { Box, useComments, type C } from "./comments";
import { MemberMark } from "./member-mark";
import { postWhy, useReviewPost } from "./racket";
import { PendingReviews, useOwner } from "./review-admin";
import { HelpfulEditor } from "./helpful-admin";
import { grow } from "./name";
import { signInHref } from "./use-account";
import { MoreMenu, OPEN_REVIEW, PollPointer, reportPost, ReviewRow, WebSources, type Changed } from "./racket-v7b";

const ACCOUNTS = accountSite(niche.id);
/** PadelRecs (owner 2026-11-21): a plain post by default, saved types (drizzle/0035), and these prompts. Other sites on this
 *  feed (AudioRecs) keep the earlier composer and the guessed QUESTION / TIP. */
const PADEL = niche.id === "padel";
/** The sites with saved post types (drizzle/0035, lib/thread/sites.ts postTypeSite): a saved Question or Tip wins, else the
 *  question rule; the others keep the guessed QUESTION / TIP. */
const TYPED = postTypeSite(niche.id);
const flairOf = (c: C): Exclude<Flair, "review"> | null => TYPED ? c.type ?? postFlair(c.body) : guessedFlair(c.body);
type Item = { key: string; flair: Flair | null; at: string; top: number } & ({ review: RvCard } | { post: C });
const CHIPS: [Flair | "all", string][] = [["all", "All"], ["review", "Reviews"], ["question", "Questions"], ["tip", "Tips"]];
const PAGE = 8;

export function CommunityFeed({ id, model, cards, web }: { id: string; model: string; cards: RvCard[]; web: WebGroups<RvCard> }) {
  const rv = useReviewPost(id), t = useComments(`racket:${id}`), owner = useOwner();
  // The owner's "Edit helpful" box (drizzle/0036): one post at a time.
  const [helpOpen, setHelpOpen] = useState<string | null>(null);
  // The composer (owner 2026-11-21): open or closed, and an optional type. None picked posts a plain comment with no flair.
  const [composing, setComposing] = useState(false), [kind, setKind] = useState<Flair | null>(null), [filter, setFilter] = useState<Flair | "all">("all"), [sort, setSort] = useState<"new" | "top">("new");
  const [shown, setShown] = useState(PAGE), [openReplies, setOpenReplies] = useState<Record<string, true>>({}), [changed, setChanged] = useState<Record<string, Changed>>({});
  // The poll's "Want to add a line about why?" (racket.tsx Poll) opens this composer on Review, with the vote picked.
  useEffect(() => { const on = (e: Event) => { const v = (e as CustomEvent<Verdict>).detail; setComposing(true); setKind("review"); rv.setOpen(true); if (v) rv.setVerdict(v);
    setTimeout(() => document.getElementById("reviews")?.scrollIntoView({ block: "start", behavior: "smooth" }), 30); };
    addEventListener(OPEN_REVIEW, on); return () => removeEventListener(OPEN_REVIEW, on); }, [rv.setOpen, rv.setVerdict]);
  const reviews = useMemo(() => cards.filter(c => !changed[c.id]?.gone).map(c => { const x = changed[c.id];
    return x ? { ...c, ...(x.text ? { text: x.text } : {}), ...(x.alias ? { who: x.alias, alias: x.alias, meta: null } : {}) } : c; }), [cards, changed]);
  const items = useMemo<Item[]>(() => [
    ...reviews.map(c => ({ key: `rv-${c.id}`, flair: "review" as const, at: c.at ?? "", top: c.helpful, review: c })),
    ...t.tops.map(c => ({ key: `cm-${c.id}`, flair: flairOf(c), at: activity(c.at, t.replies(c.id)), top: c.score, post: c })),
  ], [reviews, t.tops, t.replies]);
  // Under THIN_REVIEWS posts in all (reviews and top-level posts): the compact look of #601, and the web box open in full.
  const thin = isThin(items.length);
  const list = useMemo(() => items.filter(i => filter === "all" || i.flair === filter)
    .sort((a, b) => sort === "top" ? b.top - a.top || b.at.localeCompare(a.at) : b.at.localeCompare(a.at)), [items, filter, sort]);
  // A link to one review or post (#rv-…, #cm-…) opens the list far enough and scrolls there once the posts are in.
  // #reply-<id> (the home's and /questions' "Answer first ›"): that post's reply box opens too.
  useEffect(() => { const h = location.hash.slice(1); if (!/^(rv|cm|reply)-/.test(h) || !t.list) return;
    const reply = h.startsWith("reply-") ? h.slice(6) : null, el = reply ? `cm-${reply}` : h;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(Infinity); if (reply && t.list.some(c => c.id === reply)) t.setReply(reply);
    setTimeout(() => document.getElementById(el)?.scrollIntoView({ block: "center" }), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!t.list]);
  const start = (k: Flair | null) => { setComposing(true); setKind(k); t.setNote(""); rv.setOpen(k === "review"); };
  // A type is a toggle: clicking the picked one again goes back to a plain post.
  const toggle = (k: Flair) => start(PADEL && kind === k ? null : k);
  const close = () => { setComposing(false); setKind(null); rv.setOpen(false); rv.setError(""); };

  const Av = ({ c, sm }: { c: C; sm?: boolean }) => { const a = avatarOf(commenterName(c.alias)); return <span className={`th7-av${sm ? " sm" : ""}`} style={{ background: a.bg }} aria-hidden="true">{a.init}</span>; };
  const textOf = (c: C) => t.editing?.id === c.id ? <div className="th-compose" style={{ margin: "4px 0" }}>
    <span className="th-as"><input defaultValue={t.draftName.current} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Poster's name" autoFocus={t.editing.nameOnly} onChange={e => { t.draftName.current = e.target.value; t.setEditErr(""); }}/></span>
    {!t.editing.nameOnly && <textarea className="th-ta" rows={3} defaultValue={t.editing.text} maxLength={2000} aria-label="Edit post" onChange={e => { t.draft.current = e.target.value; }}/>}
    {t.editErr && <span className="th-err" role="alert">{t.editErr}</span>}
    <div className="th-compose-foot"><button type="button" className="cancel" onClick={() => t.setEditing(null)}>Cancel</button>
      <button type="button" className="th-btn dark" onClick={() => t.own(c, "edit", t.editing!.nameOnly ? undefined : t.draft.current, t.draftName.current)}>{t.editing.nameOnly ? "Save name" : "Save"}</button></div></div>
    : <p className="th7-cm-text">{c.body}</p>;
  const menu = (c: C) => <MoreMenu items={[{ label: "Report", run: () => reportPost(`cm-${c.id}`) }]}
    owner={t.admin && !c.id.startsWith("temp-") ? [{ label: "Edit", run: () => t.open_(c, false) }, ...(c.alias !== "[removed]" ? [{ label: "Rename", run: () => t.open_(c, true) }] : []),
      { label: "Hide", run: () => t.own(c, "hide") }, { label: "Delete", danger: true, run: () => t.own(c, "delete") },
      { label: "Edit helpful", run: () => setHelpOpen(c.id) }] : []}/>;
  const helpBox = (c: C) => helpOpen === c.id && <HelpfulEditor kind="comment" id={c.id} onClose={() => setHelpOpen(null)}/>;
  const up = (c: C) => <button type="button" className="th7-up" aria-label="Upvote" aria-pressed={c.mine === 1} onClick={() => t.vote(c, 1)}><span aria-hidden="true">▲</span>{c.score}</button>;
  const head = (c: C, flair?: Flair | null) => <div className="th7-cm-head">{flair && <span className={`th-flair ${flair}`}>{FLAIR_WORD[flair]}</span>}
    <strong>{commenterName(c.alias)}</strong>{c.member && <MemberMark/>}<span>{ago(c.at)}</span></div>;
  const box = (placeholder: string, cta: string, onPost: (x: string) => Promise<boolean>, onCancel: () => void, mention?: string) =>
    <Box me={t.me} nick={t.nick} setNick={t.setNick} nicknames={[]} placeholder={placeholder} cta={cta} onPost={onPost} onCancel={onCancel} mention={mention} back="#reviews"/>;
  // A render function, not a component: a component made here would remount on every render and drop a half-typed reply.
  const post = (c: C, flair: Flair | null) => { const all = t.replies(c.id), more = all.length - REPLIES_SHOWN, rs = openReplies[c.id] ? all : all.slice(0, REPLIES_SHOWN);
    return <div key={`cm-${c.id}`} id={`cm-${c.id}`} className="th7-cm th-feed-post"><Av c={c}/>
      <div className="th7-cm-body">
        {head(c, flair)}{textOf(c)}
        <div className="th7-cm-act">{up(c)}<button type="button" className="reply" onClick={() => t.setReply(t.reply === c.id ? null : c.id)}>{t.reply === c.id ? "Cancel" : "Reply"}</button>{menu(c)}</div>
        {helpBox(c)}
        {t.reply === c.id && box(`Reply to ${commenterName(c.alias)}`, "Reply", x => t.post(x, c.id), () => t.setReply(null))}
        {rs.length > 0 && <div className="th7-replies">{rs.map(r => <div key={r.id} id={`cm-${r.id}`} className="th7-cm sm"><Av c={r} sm/>
          <div className="th7-cm-body">
            {head(r)}{textOf(r)}
            <div className="th7-cm-act">{up(r)}<button type="button" className="reply" onClick={() => t.setReply(t.reply === r.id ? null : r.id)}>{t.reply === r.id ? "Cancel" : "Reply"}</button>{menu(r)}</div>
            {helpBox(r)}
            {t.reply === r.id && box(`Reply to ${commenterName(r.alias)}`, "Reply", x => t.post(x, c.id), () => t.setReply(null), mentionOf(commenterName(r.alias)))}
          </div></div>)}
          {more > 0 && !openReplies[c.id] && <button type="button" className="th-feed-more" onClick={() => setOpenReplies(m => ({ ...m, [c.id]: true }))}>{`View ${more} more ${more === 1 ? "reply" : "replies"}`}</button>}
        </div>}
      </div></div>; };

  const reviewForm = <div className="th-compose soft">
    {rv.me ? <div className="th-as th-as-me">Posting as <b>{rv.me.name}</b><MemberMark/></div>
      : <div className="th-as"><input value={rv.nick} onChange={e => { rv.setNick(e.target.value); rv.setError(""); }} maxLength={NAME_MAX} placeholder="Name or nickname" aria-label="Name or nickname" required/></div>}
    <div className="th-picks"><span className="lbl" style={{ fontSize: 13.5, color: "var(--ink2)", minWidth: 0 }}>{W.triedIt}</span>
      {VERDICTS.map(v => <button key={v.key} type="button" className={`th-vpick ${VERDICT[v.key][1]}`} aria-pressed={rv.verdict === v.key} onClick={() => { rv.setVerdict(v.key as Verdict); rv.setError(""); }}><span className={`th-sdot ${VERDICT[v.key][1]}`}/>{VERDICT[v.key][0]}</button>)}
    </div>
    <textarea className="th-ta th-ta-grow" rows={3} autoFocus value={rv.text} onChange={e => { rv.setText(e.target.value); rv.setError(""); grow(e.currentTarget, 240); }} maxLength={2000} placeholder={PADEL ? "How did it play for you?" : "Write your review"} aria-label="Your review"/>
    {rv.error && <span className="th-err">{rv.error}</span>}
    <div className="th-compose-foot"><span className="th-grow"/>{rv.me || !ACCOUNTS ? null : <a className="th-signin" href={signInHref("#reviews")}>Sign in to keep your name</a>}
      <button type="button" className="cancel" onClick={close}>Cancel</button>
      <button type="button" className="th-post" disabled={!rv.verdict || rv.busy || (!!rv.text.trim() && !!nameProblem(rv.nick))} onClick={rv.post}>{rv.busy ? "Posting…" : "Post"}</button></div>
    {!rv.busy && postWhy(rv.verdict, rv.text, rv.nick) && <span className="th-why" style={{ alignSelf: "flex-end" }}>{postWhy(rv.verdict, rv.text, rv.nick)}</span>}
  </div>;
  // The type picker: Review · Question · Tip, the open one pressed.
  const picker = <div className="th-feed-types" role="group" aria-label="What are you posting?">{(["review", "question", "tip"] as const).map(k =>
    <button key={k} type="button" aria-pressed={kind === k} onClick={() => toggle(k)}>{FLAIR_WORD[k]}</button>)}</div>;
  // Thin feeds (#601): the invitation takes the composer's place, with the poll pointer, so a quiet page says where players are.
  const composer = !composing ? thin ? <div className="th7-invite">
      <span>{items.length === 0 ? `No ${W.person} reviews yet. ${W.usedIt} Add the first one` : `${W.usedIt} Add yours`}</span>
      <button type="button" className="th-btn round lime" onClick={() => start("review")}>+ Add your review</button>
      <button type="button" className="th-feed-alt" onClick={() => start("question")}>Ask a question or share a tip</button><PollPointer/></div>
    : <button type="button" className="th7-ask th-feed-ask" onClick={() => start(PADEL ? null : "review")}><span aria-hidden="true">+</span>Share a review, ask a question or a tip</button>
    : <div className="th-feed-compose">{picker}
      {kind === "review" ? (rv.open && reviewForm)
        : box(PADEL ? kind === "question" ? "What do you want to know?" : kind === "tip" ? "Share something that helped" : `Say something about the ${model}…`
          : kind === "question" ? `What do you want to know about the ${model}?` : `Share a tip about the ${model}`, "Post",
          // The sites with post types save the picked Question or Tip with the post (drizzle/0035); no pick is a plain post.
          async x => { const ok = await t.post(x, null, TYPED && (kind === "question" || kind === "tip") ? kind : undefined); if (ok) close(); return ok; }, close)}</div>;

  return <>
    <section id="reviews" className={`th-card th7-card th7-reviews th-feed${thin ? " thin" : ""}`}>
      {/* Older links point at #discussion and #comments (the separate Ask the community box). */}
      <span id="discussion" className="th7-anchor" aria-hidden="true"/><span id="comments" className="th7-anchor" aria-hidden="true"/>
      <div className="th7-head"><h2 className="th-h2 th7-hic"><svg width="24" height="22" viewBox="0 0 30 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true"><path d="M15 3C8 3 3 7.3 3 12.5c0 2.6 1.3 5 3.4 6.7L5 25l6.3-3.2c1.2.3 2.4.5 3.7.5 7 0 12-4.3 12-9.8S22 3 15 3z"/></svg>
        {/* No counts above the lists (owner 2026-11-21): the title, no number, no mix line. */}{`${W.People} on the ${model}`}</h2>
        {followSite(niche.id) && <FollowButton id={id} name={model} place="feed"/>}</div>
      <PendingReviews racketId={id} compact/>
      {rv.done ? <p className="th-ok" role="status">{rv.done === "words" ? "Thanks for sharing! Your review will appear here once it's approved." : rv.done === "live" ? "Thanks for sharing! Your review is live and shows here after a refresh." : "Thanks! Your vote has been added."}</p> : composer}
      {t.note && <p className="th-ok" role="status">{t.note}</p>}
      {t.err && <span className="th-err" role="alert">{t.err}</span>}
      {!thin && <div className="th-feed-bar">
        <div className="th7-chipset" role="group" aria-label="Show">{CHIPS.map(([k, l]) =>
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => { setFilter(k); setShown(PAGE); }}>{l}</button>)}</div>
        <div className="th-seg" role="group" aria-label="Sort"><span className="lbl">Sort</span>
          {([["new", "Newest activity"], ["top", "Top"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}</div>
      </div>}
      <div className="th7-rv-list th-feed-list">
        {list.slice(0, shown).map(i => "review" in i
          ? <ReviewRow key={i.key} c={i.review} owner={owner} flair onChange={x => setChanged(m => ({ ...m, [i.review.id]: { ...m[i.review.id], ...x } }))}/>
          : post(i.post, i.flair))}
        {items.length > 0 && list.length === 0 && <p className="th-empty">Nothing here yet. <button type="button" onClick={() => setFilter("all")}>Show all</button></p>}
      </div>
      {list.length > shown && <button type="button" className="th-btn th-center" style={{ margin: "4px 0 8px" }} onClick={() => setShown(s => s + 16)}>Show more</button>}
    </section>
    <WebSources web={web} open={thin}/>
  </>;
}
