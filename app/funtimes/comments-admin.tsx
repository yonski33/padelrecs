// Comments tab (Thread, PadelRecs only): the comments held by auto-moderation (a link or very short) wait here as Pending;
// Approve shows one on its page, Reject hides it. Any comment, approved or not and replies too, can be edited (same author,
// time and votes) or deleted (with replies it becomes "[removed]"). Find one by racket or by words. Plain forms, no JavaScript.
import { adminComments, type AdminComment } from "../../db/comments";
import { database } from "../../db/data";
import { GUIDE_PATHS, th, type GuideKey } from "../../lib/thread/look";
import { productHref } from "../../lib/niche";

const STATUSES: AdminComment["status"][] = ["pending", "approved", "rejected"];
const MESSAGES: Record<string, string> = { approved: "Comment approved: it now shows on its page.", rejected: "Comment rejected: it's hidden.", pending: "Comment moved back to pending.",
  edited: "Comment updated. The new name and text show on its page now.", deleted: "Comment deleted, with its votes.", removed: "Comment removed: it shows as [removed] so its replies stay.",
  confirm: "Tick the box to confirm the delete.", stale: "That comment wasn't found. Reload to see the list.", invalid: "Could not save that. A name needs 2 to 24 characters with no links, and a comment 2 to 2,000.",
  failed: "Saving failed. Try again." };
type Racket = { id: string; slug: string; name: string; shape: string | null };

/** Where a comment lives, as a link to its Thread page. */
function pageLink(page: string, rackets: Map<string, { slug: string; name: string; shape: string | null }>) {
  const [kind, key] = page.split(":");
  if (kind === "racket") { const r = rackets.get(key); return r ? { label: r.name, href: th(productHref(r)) } : { label: "A racket (removed)", href: null }; }
  if (kind === "ranking") return { label: `Ranking: ${key}`, href: th(`/rankings/${key}`) };
  if (kind === "guide" && key in GUIDE_PATHS) return { label: `Guide: ${key}`, href: th(GUIDE_PATHS[key as GuideKey]) };
  return { label: page, href: null };
}

export async function CommentsAdmin({ status: asked, result, rackets, q = "", racket = "" }: { status?: string; result?: string; rackets: Map<string, Racket>; q?: string; racket?: string }) {
  const status = asked === "all" ? "all" : STATUSES.find(s => s === asked) ?? "pending";
  const pageKey = racket && rackets.has(racket) ? `racket:${racket}` : null;
  const { rows, totals } = await adminComments(await database(), status, 100, { page: pageKey, q });
  const byId = new Map(rows.map(r => [r.id, r]));
  const keep = { back: status, q, racket: pageKey ? racket : "" };
  const Hidden = ({ v }: { v: Record<string, string> }) => <>{Object.entries(v).map(([k, x]) => <input key={k} type="hidden" name={k} value={x}/>)}</>;
  const link = (s: string) => { const p = new URLSearchParams({ tab: "comments", status: s }); if (q) p.set("q", q); if (pageKey) p.set("racket", racket); return `/funtimes?${p}`; };
  const all = Object.values(totals).reduce((a, b) => a + (b ?? 0), 0);
  return <>
    {result && MESSAGES[result] && <p role="status" className={["stale", "invalid", "failed", "confirm"].includes(result) ? "form-error" : "admin-notice"}>{MESSAGES[result]}</p>}
    <p className="muted">Comments with a link or only a few words wait here. Spam is dropped before it reaches the queue; everything else shows at once.</p>
    <div className="admin-filters" aria-label="Comment status">{[...STATUSES, "all" as const].map(s => <a key={s} aria-current={status === s ? "page" : undefined} href={link(s)}>{`${s[0].toUpperCase()}${s.slice(1)} (${s === "all" ? all : totals[s] ?? 0})`}</a>)}</div>
    <form method="get" action="/funtimes" className="admin-filters admin-find" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}><input type="hidden" name="tab" value="comments"/><input type="hidden" name="status" value={status}/>
      <input name="q" defaultValue={q} placeholder="Words in the comment or name" aria-label="Search comments"/>
      <select name="racket" defaultValue={pageKey ? racket : ""} aria-label="Racket"><option value="">Any page</option>{[...rackets.values()].sort((a, b) => a.name.localeCompare(b.name)).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      <button className="button">Find</button>{(q || pageKey) && <a href={`/funtimes?tab=comments&status=${status}`}>Clear</a>}</form>
    <div className="admin-queue">{rows.map(c => { const where = pageLink(c.page, rackets), parent = c.parentId ? byId.get(c.parentId) : null;
      return <article className="review" key={c.id}>
        <div className="review-top"><strong>{c.alias}</strong><span className="admin-status">{c.status}</span><span className="muted">{new Date(c.at).toLocaleString("en-GB", { timeZone: "UTC" })}</span></div>
        <h3>{where.href ? <a href={where.href}>{where.label}</a> : where.label}</h3>
        {c.parentId && <p className="muted">{parent ? `Reply to ${parent.alias}` : "A reply (it shows only once its comment is approved)"}</p>}
        <p className="review-text" style={{ whiteSpace: "pre-wrap" }}>{c.body}</p>
        {c.spamScore > 0 && <p className="muted">{`Spam check score ${c.spamScore} (3 or more is dropped)`}</p>}
        <div className="admin-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>{STATUSES.filter(s => s !== c.status).map(s =>
          <form key={s} method="post" action="/api/funtimes/comments"><Hidden v={{ action: "status", id: c.id, status: s, ...keep }}/>
            <button className={s === "approved" ? "button" : "button ghost"}>{s === "approved" ? "Approve" : s === "rejected" ? "Reject" : "Move to pending"}</button></form>)}
          <details><summary className="button ghost">Edit</summary>
            <form method="post" action="/api/funtimes/comments" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6, minWidth: 320 }}><Hidden v={{ action: "edit", id: c.id, ...keep }}/>
              <label className="muted" style={{ display: "flex", flexDirection: "column", gap: 2 }}>Name<input name="alias" defaultValue={c.alias === "[removed]" ? "" : c.alias} minLength={2} maxLength={24} required aria-label="Commenter name"/></label>
              <textarea name="body" defaultValue={c.body} rows={4} minLength={2} maxLength={2000} required aria-label="Comment text"/>
              <span className="muted">Same time and votes. Change the name for abuse cases. No edited mark shows on the page.</span><button className="button">Save</button></form></details>
          <details><summary className="button ghost">Delete</summary>
            <form method="post" action="/api/funtimes/comments" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}><Hidden v={{ action: "delete", id: c.id, ...keep }}/>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" name="confirm" value="yes" required/>{c.parentId ? "Yes, delete this reply" : "Yes, delete it (with replies it shows as [removed])"}</label>
              <button className="danger-button">Delete comment</button></form></details>
        </div>
      </article>; })}
      {!rows.length && <p className="admin-empty">{q || pageKey ? "No comments match." : `No ${status === "all" ? "" : `${status} `}comments.`}</p>}</div>
  </>;
}
