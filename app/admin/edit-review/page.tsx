import {redirect,notFound} from "next/navigation";
import {eq} from "drizzle-orm";
import {isAdmin} from "../auth";
import {database} from "../../../db/data";
import {reviews,externalReviews,rackets} from "../../../db/schema";
import {reviewRevision} from "../../../db/review-editing";
import RacketEditSelector from "../racket-edit-selector";
import {TagCheckboxes} from "../../tags";
import {niche} from "../../../lib/niche";
const {profile}=niche;
export const dynamic="force-dynamic";
export const metadata={title:"Edit review",robots:{index:false,follow:false}};
const errors:Record<string,string>={invalid:"Check the required fields, ratings, email and source URL. Review text must contain at least 20 characters.",stale:"This review changed while you were editing. Its latest values are shown below. Check them before saving again.",missing:"This review no longer exists.",failed:"Could not save your changes. Please try again."};

export default async function EditReview({searchParams}:{searchParams:Promise<{type?:string,id?:string,result?:string}>}){
 if(!await isAdmin())redirect("/admin/login");
 const q=await searchParams;if(!q.id||q.id.length>100||!["player","web"].includes(q.type||""))notFound();
 const db=await database(),web=q.type==="web";
 const [player]=web?[]:await db.select().from(reviews).where(eq(reviews.id,q.id));
 const [external]=web?await db.select().from(externalReviews).where(eq(externalReviews.id,q.id)):[];
 const selected=player||external;if(!selected)notFound();
 const models=await db.select({id:rackets.id,name:rackets.name}).from(rackets).orderBy(rackets.name);
 const back=web?"/admin?tab=web":`/admin?status=${player!.status}`;
 return <main className="narrow"><div className="page-title"><h1>Edit {web?"web review":`${niche.people.one} submission`}</h1></div>
 <p><a href={back}>← Back to reviews</a></p>
 {q.result&&errors[q.result]&&<p className="form-error" role="alert">{errors[q.result]}</p>}
 <form action="/api/admin/edit-review" method="post" className="review-form">
 <input type="hidden" name="type" value={web?"web":"player"}/><input type="hidden" name="id" value={selected.id}/><input type="hidden" name="revision" value={reviewRevision(selected)}/>
 <input type="hidden" name="returnStatus" value={player?.status||"pending"}/>
 <RacketEditSelector key={selected.id} models={models} racketId={selected.racketId}/>
 {player?<>
  <p className="small muted">Status: {player.status}. Saving keeps this moderation status.</p>
  <label className="field">Overall rating<select name="rating" required defaultValue={player.rating}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>
  <label className="field">Review text<textarea name="reviewText" required minLength={20} defaultValue={player.reviewText}/></label>
  <div className="form-grid"><label className="field">Alias<input name="alias" maxLength={50} defaultValue={player.alias||""}/></label><label className="field">Private email<input name="email" type="email" maxLength={254} defaultValue={player.email||""}/><small>Not shown publicly.</small></label></div>
  <div className="form-grid">{(["playerLevel","playingSide","playingStyle","timeWithRacket"] as const).map(name=><label className="field" key={name}>{profile[name].adminLabel}<select name={name} defaultValue={player[name]||""}><option value="">Not provided</option>{profile[name].options.map(o=><option key={o.value}>{o.value}</option>)}</select></label>)}</div>
  <fieldset><legend>Category ratings</legend><div className="form-grid">{niche.categories.map(({column:name,label,adminLabel})=><label className="field" key={name}>{adminLabel??label}<select name={name} defaultValue={player[name]??""}><option value="">Not rated</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>)}</div></fieldset>
  <TagCheckboxes selected={player.tags}/>
 </>:external?<>
  <label className="field">Summary <span className="muted">(our own words)</span><textarea name="summary" maxLength={1200} defaultValue={external.summary??""}/><small>Shown first, labelled “{niche.site.name} summary”. Leave blank to show only the excerpt.</small></label>
  <label className="field">Excerpt <span className="muted">(the source’s exact words)</span><textarea name="excerpt" defaultValue={external.excerpt??""}/><small>Shown as “In their words”. At least 20 characters; may be blank if there is a summary.</small></label>
  <div className="form-grid"><label className="field">Source platform<select name="sourcePlatform" required defaultValue={external.sourcePlatform}>{niche.sourcePlatforms.map(s=><option key={s}>{s}</option>)}</select></label><label className="field">Source name<input name="sourceName" required maxLength={120} defaultValue={external.sourceName}/></label></div>
  <label className="field">Original source link<input name="sourceUrl" type="url" required maxLength={2000} defaultValue={external.sourceUrl}/></label>
  <label className="field">Source date<input name="sourceDate" type="date" defaultValue={external.sourceDate||""}/></label>
  <TagCheckboxes selected={external.tags}/>
  <p className="small muted">Saving updates this published web review immediately.</p>
 </>:null}
 <button type="submit">Save changes</button>
 </form></main>;
}
