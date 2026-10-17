import type { Metadata } from "next";
import { and, count, desc, eq, notLike } from "drizzle-orm";
import { database } from "../../db/data";
import { reviews, rackets, externalReviews, brands } from "../../db/schema";
import { isAdmin } from "./auth";
import { getCurrentUser } from "../../lib/supabase/auth";
import RacketPicker from "../racket-picker";
import RacketSpecs from "./racket-specs";
import { Stars } from "../components";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {title: "Review admin", robots: {index: false, follow: false}};
const date = (value:string) => new Date(value).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
const messages: Record<string,string> = {
 approved:"Review approved. It is now visible in the feed and included in racket ratings.",
 rejected:"Review rejected. It is hidden from the feed and excluded from ratings.",
 pending:"Review moved back to pending and hidden from the public feed.",
 web:"Web review published.",
 invalid:"Please check all fields. A web review needs an existing racket or a new brand, model and year (1980–2100), an excerpt of at least 20 characters, source details, and a valid HTTP or HTTPS source link.",
 missing:"That review no longer exists.",
 stale:"This review changed since the page loaded. Check its current status and try again.",
 "spec-saved":"Racket specs saved. The public racket page has been updated.",
 "spec-invalid":"Check the racket name, brand, year (1980–2100), and field lengths.",
 "spec-missing":"That racket no longer exists. Choose another racket.",
 failed:"Could not save your changes. Please try again."
};
export default async function Admin({searchParams}:{searchParams:Promise<{status?:string,tab?:string,page?:string,result?:string,racket?:string}>}) {
 if (!(await isAdmin())) {
  const user = await getCurrentUser();
  return <main className="narrow"><div className="page-title"><h1>Review admin</h1></div><p>{user ? "This account does not have admin access." : "Sign in with the owner account to manage reviews."}</p>{!user && <a className="button" href="/admin/login">Admin sign in →</a>}<p><a href="/">Back to reviews</a></p></main>;
 }
 const q=await searchParams, web=q.tab==="web", specs=q.tab==="specs";
 const status = q.status==="approved"||q.status==="rejected" ? q.status : "pending";
 const page = Math.max(1, Math.min(100000, parseInt(q.page||"1",10)||1));
 const db = await database();
 const [models, totals, queue, external, allBrands] = await Promise.all([
  db.select().from(rackets).orderBy(rackets.name),
  db.select({status:reviews.status,total:count()}).from(reviews).where(notLike(reviews.id,"demo-%")).groupBy(reviews.status),
  db.select().from(reviews).where(and(eq(reviews.status,status),notLike(reviews.id,"demo-%"))).orderBy(desc(reviews.createdAt)).limit(21).offset((page-1)*20),
  web ? db.select().from(externalReviews).where(notLike(externalReviews.id,"demo-%")).orderBy(desc(externalReviews.createdAt)).limit(20) : Promise.resolve([]),
  (web||specs) ? db.select({id:brands.id,name:brands.name}).from(brands).orderBy(brands.name) : Promise.resolve([])
 ]);
 return <main><div className="page-title"><h1>Review admin</h1><p className="muted">Manage player submissions, web reviews, and racket specifications.</p></div>
 <nav className="admin-nav" aria-label="Admin sections"><a href="/admin" aria-current={!web&&!specs?"page":undefined}>Player submissions</a><a href="/admin?tab=web" aria-current={web?"page":undefined}>Add a web review</a><a href="/admin?tab=specs" aria-current={specs?"page":undefined}>Racket specs</a></nav>
 {q.result && messages[q.result] && <p role="status" className={["invalid","missing","stale","failed","spec-invalid","spec-missing"].includes(q.result)?"form-error":"admin-notice"}>{messages[q.result]}</p>}
 {specs ? <RacketSpecs models={models} brands={allBrands} racketId={q.racket}/> : web ? <div className="columns"><div><h2 className="admin-heading">Add a web review</h2><p className="small muted">Publishes immediately. Add a short excerpt and link to its original source.</p>
 <form method="post" action="/api/admin/external-reviews" className="review-form">
 <RacketPicker models={models} brands={allBrands}/>
 <label className="field">Review excerpt<textarea name="excerpt" required minLength={20} placeholder="A short excerpt from the original review…"/><small>At least 20 characters. Keep the original meaning and credit the source.</small></label>
 <div className="form-grid"><label className="field">Source platform<select name="sourcePlatform" required defaultValue="Reddit">{["Reddit","YouTube","Padel shop","Forum","Other"].map(s=><option key={s}>{s}</option>)}</select></label><label className="field">Source name<input name="sourceName" required maxLength={120} placeholder="e.g. r/padel or a channel name"/></label></div>
 <label className="field">Original source link<input name="sourceUrl" type="url" required maxLength={2000} placeholder="https://…"/><small>Use a direct link to the specific review, comment, or video.</small></label>
 <label className="field">Source date <span className="muted">(optional)</span><input name="sourceDate" type="date"/><small>Leave blank if the original publication date is unknown.</small></label>
 <p className="small muted">Web excerpts appear with their source below the text. They have no star rating and do not affect player averages.</p><button type="submit">Publish web review</button></form>
 <h2 className="admin-heading">Recently added by you</h2>{external.length ? external.map(e=><article className="review" key={e.id}><h3>{models.find(r=>r.id===e.racketId)?.name}</h3><p className="review-text">{e.excerpt}</p><div className="review-meta">{e.sourcePlatform} · {e.sourceName}</div><div className="byline"><a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">Original source ↗</a><span>Added {date(e.createdAt)}</span></div></article>) : <p className="muted">No web reviews added yet.</p>}</div><aside><section><h2>Before you publish</h2><p>Use a short, accurate excerpt. Include a direct source link and respect the original author’s context.</p></section></aside></div> : <>
 <div className="admin-filters" aria-label="Review status">{["pending","approved","rejected"].map(s=><a key={s} aria-current={status===s?"page":undefined} href={`/admin?status=${s}`}>{s[0].toUpperCase()+s.slice(1)} ({totals.find(t=>t.status===s)?.total||0})</a>)}</div>

 <div className="admin-queue">{queue.slice(0,20).map(r=>{const model=models.find(m=>m.id===r.racketId);return <article className="review" key={r.id}>
 <div className="review-top"><Stars rating={r.rating}/><span className="admin-status">{r.status}</span></div><h3><a href={`/rackets/${model?.slug}`}>{model?.name}</a></h3>
 <p className="review-text">{r.reviewText}</p><div className="review-meta">{[r.playerLevel,r.playingSide,r.playingStyle,r.timeWithRacket].filter(Boolean).join(" · ")||"No player details provided"}</div>
 <div className="byline"><span>by <b>{r.alias||"Anonymous player"}</b></span><time dateTime={r.createdAt}>{date(r.createdAt)}</time></div>
 <p className="small muted">Private email: {r.email||"Not provided"}</p>
 <div className="admin-actions">{["approved","rejected","pending"].filter(s=>s!==r.status).map(next=><form action="/api/admin/reviews" method="post" key={next}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="status" value={next}/><input type="hidden" name="expectedStatus" value={r.status}/><input type="hidden" name="returnStatus" value={status}/><button type="submit" className={next==="approved"?"":"secondary-button"}>{next==="approved"?"Approve":next==="rejected"?"Reject":"Move to pending"}</button></form>)}</div>
 </article>})}{!queue.length && <p className="admin-empty">No {status} submissions.</p>}</div>
 <div className="admin-pagination">{page>1&&<a href={`/admin?status=${status}&page=${page-1}`}>← Newer</a>}{queue.length>20&&<a href={`/admin?status=${status}&page=${page+1}`}>Older →</a>}</div>
 </>}
 </main>;
}
