import {test} from "node:test";
import assert from "node:assert/strict";
import {migrationSql} from "../db/migrations";
import {PGlite} from "@electric-sql/pglite";
import {drizzle} from "drizzle-orm/pglite";
import {eq} from "drizzle-orm";
import {fixture} from "./fixture";
import {parseSnapshot,importSnapshot} from "../db/transfer";
import {reviews,externalReviews,rackets} from "../db/schema";
import {reviewEditInput,reviewRevision,saveReviewEdit} from "../db/review-editing";
import {catalog,score} from "../db/data";
import type {getDb} from "../db/index";
import {POST} from "../app/api/admin/edit-review/route";

const fields=(row:object)=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value??""]));
test("player and web edits preserve identity and dates, update public data, and reject stale forms",async()=>{
 const engine=new PGlite();
 try{
  for(const statement of migrationSql("padelrecs"))await engine.exec(statement);
  const db=drizzle(engine),portable=db as unknown as ReturnType<typeof getDb>;
  await importSnapshot(portable,parseSnapshot(fixture));
  const [oldRacket]=await db.select().from(rackets);
  await db.insert(rackets).values({...oldRacket,id:"move-target",name:"Another racket",slug:"another-racket"});
  const [player]=await db.select().from(reviews).where(eq(reviews.id,"approved-review"));
  const edit=reviewEditInput.parse({...fields(player),type:"player",revision:reviewRevision(player),racketId:"move-target",rating:"5",reviewText:"Edited player review. ".repeat(1000).trim(),alias:"Edited alias",email:"updated-private@example.test",powerRating:"",comfortRating:"3"});
  assert.equal(await saveReviewEdit(portable,edit),"saved");
  const [saved]=await db.select().from(reviews).where(eq(reviews.id,player.id));
  assert.equal(saved.id,player.id);assert.equal(saved.createdAt,player.createdAt);assert.equal(saved.status,"approved");
  assert.equal(saved.racketId,"move-target");assert.equal(saved.rating,5);assert.equal(saved.powerRating,null);assert.equal(saved.comfortRating,3);assert(saved.reviewText.length>20000);
  const visible=await catalog(portable);assert.equal(score(visible,"move-target").average,"5.0");assert(!JSON.stringify(visible).includes("updated-private@example.test"));
  assert.equal(await saveReviewEdit(portable,edit),"stale");
  const invalidTarget=reviewEditInput.parse({...fields(saved),type:"player",revision:reviewRevision(saved),racketId:"missing-racket"});
  assert.equal(await saveReviewEdit(portable,invalidTarget),"invalid");
  const [pending]=await db.select().from(reviews).where(eq(reviews.id,"pending-review"));
  const pendingEdit=reviewEditInput.parse({...fields(pending),type:"player",revision:reviewRevision(pending),reviewText:"Edited pending review text, still private."});
  assert.equal(await saveReviewEdit(portable,pendingEdit),"saved");
  assert.equal((await db.select().from(reviews).where(eq(reviews.id,pending.id)))[0].status,"pending");
  const [web]=await db.select().from(externalReviews);
  const webEdit=reviewEditInput.parse({...fields(web),type:"web",revision:reviewRevision(web),racketId:"move-target",excerpt:"Edited web review. ".repeat(1500).trim(),sourcePlatform:"YouTube",sourceName:"Updated source",sourceUrl:"https://example.com/updated-review",sourceDate:"2026-10-17"});
  assert.equal(await saveReviewEdit(portable,webEdit),"saved");
  const [savedWeb]=await db.select().from(externalReviews);
  assert.equal(savedWeb.id,web.id);assert.equal(savedWeb.createdAt,web.createdAt);assert.equal(savedWeb.externalRating,web.externalRating);assert.equal(savedWeb.sourceName,"Updated source");assert.equal(savedWeb.sourceDate,"2026-10-17");assert(savedWeb.excerpt!.length>20000);
  assert.equal(await saveReviewEdit(portable,webEdit),"stale");
  assert.equal(await saveReviewEdit(portable,{...webEdit,id:"missing-review"}),"missing");
  assert.equal((await db.select().from(reviews)).length,2);assert.equal((await db.select().from(externalReviews)).length,1);
 }finally{await engine.close();}
});
test("review edit validation rejects unsafe source links, invalid dates and out-of-range ratings",()=>{
 const web={type:"web",id:"id",revision:"a".repeat(64),racketId:"racket",excerpt:"A sufficiently long review excerpt.",sourcePlatform:"Reddit",sourceName:"Forum",sourceUrl:"javascript:alert(1)",sourceDate:"2026-02-30"};
 assert.equal(reviewEditInput.safeParse(web).success,false);
 assert.equal(reviewEditInput.safeParse({...web,sourceUrl:"https://example.com/review",sourceDate:""}).success,true);
 const player={...fields(fixture.tables.reviews[0]),type:"player",id:"id",revision:"a".repeat(64),racketId:"racket",rating:6,reviewText:"A sufficiently long player review.",alias:"",email:"",playerLevel:"",playingSide:"",playingStyle:"",timeWithRacket:""};
 assert.equal(reviewEditInput.safeParse(player).success,false);
});
test("anonymous users cannot submit player or web edits",async()=>{
 for(const type of ["player","web"]){
  const response=await POST(new Request("https://www.padelrecs.com/api/admin/edit-review",{method:"POST",headers:{origin:"https://www.padelrecs.com","content-type":"application/x-www-form-urlencoded"},body:`type=${type}&id=approved-review`}));
  assert.equal(response.status,403);
 }
});

test("web reviews need an excerpt or a summary, and blanks become null", () => {
 const base={type:"web",id:"id",revision:"a".repeat(64),racketId:"racket",sourcePlatform:"Reddit",sourceName:"r/padel",sourceUrl:"https://example.com/review",sourceDate:""};
 const summaryOnly=reviewEditInput.parse({...base,excerpt:"",summary:"A season with it: comfortable, but short of power on smashes."});
 assert.equal(summaryOnly.type==="web"&&summaryOnly.excerpt,null);
 assert.equal(reviewEditInput.safeParse({...base,excerpt:"",summary:""}).success,false);
 assert.equal(reviewEditInput.safeParse({...base,excerpt:"too short",summary:""}).success,false);
 assert.equal(reviewEditInput.safeParse({...base,excerpt:"A quote that is long enough to show.",summary:""}).success,true);
});
