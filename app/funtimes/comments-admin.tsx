// Comments tab (Thread, PadelRecs only): the comments held by auto-moderation (a link or very short) wait here as Pending;
// Approve shows one on its page, Reject hides it. Approved and rejected lists to undo a call. Plain forms, no JavaScript needed.
import { adminComments, type AdminComment } from "../../db/comments";
import { database } from "../../db/data";
import { GUIDE_PATHS, th, type GuideKey } from "../../lib/thread/look";
import { productHref } from "../../lib/niche";

const STATUSES: AdminComment["status"][] = ["pending", "approved", "rejected"];
const MESSAGES: Record<string, string> = { approved: "Comment approved: it now shows on its page.", rejected: "Comment rejected: it's hidden.", pending: "Comment moved back to pending.",
  stale: "That comment wasn't found. Reload to see the queue.", invalid: "Could not read that request.", failed: "Saving failed. Try again." };

/** Where a comment lives, as a link to its Thread page. */
function pageLink(page: string, rackets: Map<string, { slug: string; name: string; shape: string | null }>) {
  const [kind, key] = page.split(":");
  if (kind === "racket") { const r = rackets.get(key); return r ? { label: r.name, href: th(productHref(r)) } : { label: "A racket (removed)", href: null }; }
  if (kind === "ranking") return { label: `Ranking: ${key}`, href: th(`/rankings/${key}`) };
  if (kind === "guide" && key in GUIDE_PATHS) return { label: `Guide: ${key}`, href: th(GUIDE_PATHS[key as GuideKey]) };
  return { label: page, href: null };
}

export async function CommentsAdmin({ status: asked, result, rackets }: { status?: string; result?: string; rackets: Map<string, { slug: string; name: string; shape: string | null }> }) {
  const status = STATUSES.find(s => s === asked) ?? "pending";
  const { rows, totals } = await adminComments(await database(), status);
  const byId = new Map(rows.map(r => [r.id, r]));
  return <>
    {result && MESSAGES[result] && <p role="status" className={["stale", "invalid", "failed"].includes(result) ? "form-error" : "admin-notice"}>{MESSAGES[result]}</p>}
    <p className="muted">Comments with a link or only a few words wait here. Spam is dropped before it reaches the queue; everything else shows at once.</p>
    <div className="admin-filters" aria-label="Comment status">{STATUSES.map(s => <a key={s} aria-current={status === s ? "page" : undefined} href={`/funtimes?tab=comments&status=${s}`}>{`${s[0].toUpperCase()}${s.slice(1)} (${totals[s] ?? 0})`}</a>)}</div>
    <div className="admin-queue">{rows.map(c => { const where = pageLink(c.page, rackets), parent = c.parentId ? byId.get(c.parentId) : null;
      return <article className="review" key={c.id}>
        <div className="review-top"><strong>{c.alias}</strong><span className="admin-status">{c.status}</span><span className="muted">{new Date(c.at).toLocaleString("en-GB", { timeZone: "UTC" })}</span></div>
        <h3>{where.href ? <a href={where.href}>{where.label}</a> : where.label}</h3>
        {c.parentId && <p className="muted">{parent ? `Reply to ${parent.alias}` : "A reply (it shows only once its comment is approved)"}</p>}
        <p className="review-text" style={{ whiteSpace: "pre-wrap" }}>{c.body}</p>
        {c.spamScore > 0 && <p className="muted">{`Spam check score ${c.spamScore} (3 or more is dropped)`}</p>}
        <div className="admin-actions" style={{ display: "flex", gap: 8 }}>{STATUSES.filter(s => s !== c.status).map(s =>
          <form key={s} method="post" action="/api/funtimes/comments"><input type="hidden" name="id" value={c.id}/><input type="hidden" name="status" value={s}/><input type="hidden" name="back" value={status}/>
            <button className={s === "approved" ? "button" : "button ghost"}>{s === "approved" ? "Approve" : s === "rejected" ? "Reject" : "Move to pending"}</button></form>)}</div>
      </article>; })}
      {!rows.length && <p className="admin-empty">{`No ${status} comments.`}</p>}</div>
  </>;
}
