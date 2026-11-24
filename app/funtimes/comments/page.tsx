// Latest comments (owner 2026-11-24): every comment on this site, newest first, 50 a page, by status and by words, with
// moderation on each row (approve, reject to hide, hold as pending, edit the text, rename, delete) and in bulk for the
// ticked rows. Server-drawn plain forms to /api/funtimes/comments; the filters live in the address (?status=&q=&p=&racket=).
// Reads one page of rows (comments_queue_idx for a status) plus three small reads keyed by the listed ids.
import type { Metadata } from "next";
import { database } from "../../../db/data";
import { rackets } from "../../../db/schema";
import { adminComments, commentExtras, REMOVED } from "../../../db/comments";
import { isAdmin } from "../auth";
import { AdminNav } from "../admin-nav";
import { SelectAll } from "./select-all";
import { getCurrentUser } from "../../../lib/supabase/auth";
import { niche, productHref } from "../../../lib/niche";
import { GUIDE_PATHS, th, threadSite, type GuideKey } from "../../../lib/thread/look";
import { COMMENT_STATUSES, COMMENTS_PER_PAGE, commentPageTarget, commentsHref, parseCommentsQuery } from "../../../lib/admin-comments";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Latest comments", robots: { index: false, follow: false } };

const MESSAGES: Record<string, string> = {
  approved: "Comment approved: it shows on its page now.", rejected: "Comment rejected: it's hidden from its page.", pending: "Comment moved to pending: hidden until approved.",
  edited: "Comment saved. The new name and text show on its page now.", deleted: "Comment deleted, with its votes.",
  removed: "Comment removed: it has replies, so it shows as [removed] and the replies stay.",
  "bulk-approved": "Approved: {n}.", "bulk-rejected": "Rejected (hidden): {n}.", "bulk-pending": "Moved to pending: {n}.", "bulk-deleted": "Deleted or removed: {n}.",
  confirm: "Tick the box to confirm the delete.", none: "Tick at least one comment first.", stale: "That comment wasn't found. The list below is current.",
  invalid: "Couldn't save that. A name needs 2 to 24 characters with no links, and a comment 2 to 2,000.", failed: "Saving failed. Try again.",
};
const ERRORS = ["confirm", "none", "stale", "invalid", "failed"];
const LABEL: Record<string, string> = { approved: "Approve", rejected: "Reject (hide)", pending: "Move to pending" };
const when = (at: string) => new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
const Hidden = ({ v }: { v: Record<string, string> }) => <>{Object.entries(v).filter(([, x]) => x !== "").map(([k, x]) => <input key={k} type="hidden" name={k} value={x}/>)}</>;
const col = { display: "flex", flexDirection: "column", gap: 6, marginTop: 6, minWidth: 300 } as const;

export default async function LatestComments({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await isAdmin())) {
    const user = await getCurrentUser();
    return <main className="narrow"><div className="page-title"><h1>Latest comments</h1></div><p>{user ? "This account does not have admin access." : "Sign in with the owner account to moderate comments."}</p>{!user && <a className="button" href="/funtimes/login">Admin sign in →</a>}</main>;
  }
  if (!threadSite(niche.id)) return <main><div className="page-title"><h1>Latest comments</h1></div><AdminNav current="comments"/><p className="admin-empty">This site has no comments.</p></main>;
  const sp = await searchParams, query = parseCommentsQuery(sp), result = typeof sp.result === "string" ? sp.result : "", n = typeof sp.n === "string" ? sp.n : "0";
  const db = await database();
  const products = new Map((await db.select({ id: rackets.id, slug: rackets.slug, name: rackets.name, shape: rackets.shape }).from(rackets)).map(r => [r.id, r]));
  const pageKey = query.racket && products.has(query.racket) ? `racket:${query.racket}` : null;
  const { rows: fetched, totals } = await adminComments(db, query.status, COMMENTS_PER_PAGE + 1, { q: query.q, page: pageKey, offset: (query.page - 1) * COMMENTS_PER_PAGE });
  const rows = fetched.slice(0, COMMENTS_PER_PAGE), more = fetched.length > COMMENTS_PER_PAGE;
  const extras = await commentExtras(db, rows);
  const look = { racket: (id: string) => { const r = products.get(id); return r ? { name: r.name, href: productHref(r) } : null; },
    guide: (k: string) => k in GUIDE_PATHS ? GUIDE_PATHS[k as GuideKey] : null, th: (h: string) => th(h) };
  const keep = { back: query.status, q: query.q, racket: pageKey ? query.racket : "", p: String(query.page) };
  const all = Object.values(totals).reduce((a, b) => a + (b ?? 0), 0);
  const message = MESSAGES[result]?.replace("{n}", n);
  return <main><div className="page-title"><h1>Latest comments</h1><p className="muted">Every comment on this site, newest first. Edit, rename, approve, hide or delete them here.</p></div>
    <AdminNav current="comments"/>
    {message && <p role="status" className={ERRORS.includes(result) ? "form-error" : "admin-notice"}>{message}</p>}
    <div className="admin-filters" aria-label="Comment status">{(["all", ...COMMENT_STATUSES] as const).map(s =>
      <a key={s} aria-current={query.status === s ? "page" : undefined} href={commentsHref({ ...query, status: s, page: 1, racket: pageKey ? query.racket : "" })}>{`${s[0].toUpperCase()}${s.slice(1)} (${s === "all" ? all : totals[s] ?? 0})`}</a>)}</div>
    <form method="get" action="/funtimes/comments" className="admin-filters admin-find" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {query.status !== "all" && <input type="hidden" name="status" value={query.status}/>}
      <input name="q" defaultValue={query.q} placeholder="Words in the comment or name" aria-label="Search comments"/>
      <select name="racket" defaultValue={pageKey ? query.racket : ""} aria-label={niche.words.One}><option value="">Any page</option>
        {[...products.values()].sort((a, b) => a.name.localeCompare(b.name)).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      <button className="button">Find</button>{(query.q || pageKey) && <a href={commentsHref({ status: query.status })}>Clear</a>}</form>

    {rows.length > 0 && <form id="bulk" method="post" action="/api/funtimes/comments" className="admin-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "16px 0" }}>
      <Hidden v={{ action: "bulk", ...keep }}/><SelectAll form="bulk"/>
      <select name="op" aria-label="Bulk action" defaultValue="approved"><option value="approved">Approve</option><option value="rejected">Reject (hide)</option><option value="pending">Move to pending</option><option value="delete">Delete</option></select>
      <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="confirm" value="yes"/>Confirm delete</label>
      <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="withReplies" value="yes"/>Delete their replies too</label>
      <button className="button">Apply to ticked</button></form>}

    <div className="admin-queue">{rows.map(c => {
      const x = extras.get(c.id), where = commentPageTarget(c.page, look);
      return <article className="review" key={c.id}>
        <div className="review-top" style={{ gap: 10, alignItems: "center" }}>
          <input type="checkbox" name="ids" value={c.id} form="bulk" aria-label={`Select the comment by ${c.alias}`}/>
          <strong>{c.alias}</strong><span className="admin-status">{c.status}</span><span className="muted">{when(c.at)}</span></div>
        <h3>{where.href ? <a href={where.href}>{where.label}</a> : where.label}</h3>
        <p className="muted small">{[x?.replyTo ? `Reply to ${x.replyTo}` : null, `Score ${x?.votes ?? 0}${x?.shown != null ? ` (shown as ${x.shown}, set by hand)` : ""}`,
          x?.replies ? `${x.replies} ${x.replies === 1 ? "reply" : "replies"}` : null, c.spamScore > 0 ? `Spam check ${c.spamScore}` : null].filter(Boolean).join(" · ")}</p>
        <p className="review-text">{c.body}</p>
        <div className="admin-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          {COMMENT_STATUSES.filter(s => s !== c.status).map(s => <form key={s} method="post" action="/api/funtimes/comments"><Hidden v={{ action: "status", id: c.id, status: s, ...keep }}/>
            <button className={s === "approved" ? "button" : "button ghost"}>{LABEL[s]}</button></form>)}
          <details><summary className="button ghost">Edit text</summary>
            <form method="post" action="/api/funtimes/comments" style={col}><Hidden v={{ action: "edit", id: c.id, ...keep }}/>
              <textarea name="body" defaultValue={c.body} rows={4} minLength={2} maxLength={2000} required aria-label="Comment text"/>
              <span className="muted small">Same name, time and votes. No edited mark shows on the page.</span><button className="button">Save text</button></form></details>
          <details><summary className="button ghost">Rename</summary>
            <form method="post" action="/api/funtimes/comments" style={col}><Hidden v={{ action: "edit", id: c.id, ...keep }}/>
              <label className="muted" style={{ display: "flex", flexDirection: "column", gap: 2 }}>Name shown<input name="alias" defaultValue={c.alias === REMOVED ? "" : c.alias} minLength={2} maxLength={24} required aria-label="Commenter name"/></label>
              <span className="muted small">Changes only this comment's name, not a member's account name.</span><button className="button">Save name</button></form></details>
          <details><summary className="button ghost">Delete</summary>
            <form method="post" action="/api/funtimes/comments" style={col}><Hidden v={{ action: "delete", id: c.id, ...keep }}/>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="confirm" value="yes" required/>Yes, delete it and its votes</label>
              {x?.replies ? <><label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="withReplies" value="yes"/>{`Also delete its ${x.replies === 1 ? "reply" : `${x.replies} replies`}`}</label>
                <span className="muted small">Left unticked, it shows as [removed] and the replies stay.</span></> : null}
              <button className="danger-button">Delete comment</button></form></details>
        </div>
      </article>; })}
      {!rows.length && <p className="admin-empty">{query.q || pageKey ? "No comments match." : `No ${query.status === "all" ? "" : `${query.status} `}comments.`}</p>}</div>
    <div className="admin-pagination">{query.page > 1 && <a href={commentsHref({ ...query, racket: pageKey ? query.racket : "", page: query.page - 1 })}>← Newer</a>}
      {more && <a href={commentsHref({ ...query, racket: pageKey ? query.racket : "", page: query.page + 1 })}>Older →</a>}</div>
  </main>;
}
