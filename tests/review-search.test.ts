import {test} from "node:test";
import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {drizzle} from "drizzle-orm/pglite";
import {migrationSql} from "../db/migrations";
import {reviewSites,searchInput,searchReviews,setSentiment,reviewLinks} from "../db/review-search";
import {checkSentiment} from "../lib/sentiment-check";
import {planImport,webReviewId} from "../db/web-review-import";
import {niches} from "../lib/niche";

test("sentiment check flags complaints in positive reviews and praise in negative ones",()=>{
 const doubtful=checkSentiment("positive","Loves the feel, but it cracked after two months and they returned it.");
 assert.ok(doubtful.score>=5);
 assert.deepEqual(doubtful.words.sort(),["but","cracked","returned"]);
 assert.equal(doubtful.suggest,"mixed");
 assert.equal(checkSentiment("positive","Has used it daily for a year and recommends it.").score,0);
 // A soft contrast still ranks, just lower than a real problem.
 assert.ok(checkSentiment("positive","Light but powerful.").score<doubtful.score);
 assert.equal(checkSentiment("positive","They wouldn't recommend it.").words[0],"wouldn’t recommend");
 assert.equal(checkSentiment("negative","Loved it at first, then it broke and they sent it back.").score,0);
 const praised=checkSentiment("negative","Excellent control, loves it, would recommend to anyone.");
 assert.equal(praised.suggest,"positive");
 assert.equal(checkSentiment("mixed","but however issue").score,0);
 // Negated complaints are praise: "no issues", "without problems", "hasn't had any complaints".
 assert.equal(checkSentiment("positive","Found the process easy with no issues, and has had it for a year without problems.").score,0);
 assert.equal(checkSentiment("positive","Hasn't had any complaints. But the strap is a bit long.").words.join(),"but");
 assert.equal(checkSentiment(null,"returned").score,0);
});

async function twoSites(){
 const engine=new PGlite();
 for(const schema of ["padelrecs","skinrecs"])for(const statement of migrationSql(schema))await engine.exec(statement);
 const add=async(schema:string,racket:string,name:string,rows:[string,string,string|null,string,string][])=>{
  await engine.query(`insert into ${schema}.brands (id,name,slug) values ('b-${racket}','Brand','brand-${racket}')`);
  await engine.query(`insert into ${schema}.rackets (id,brand_id,name,slug,year,created_at) values ($1,$2,$3,$4,2025,'2026-10-01T00:00:00Z')`,[racket,`b-${racket}`,name,racket]);
  for(const [id,summary,sentiment,url,created] of rows)await engine.query(`insert into ${schema}.external_reviews (id,racket_id,summary,sentiment,source_platform,source_name,source_url,created_at) values ($1,$2,$3,$4,'Reddit','r/test',$5,$6)`,[id,racket,summary,sentiment,url,created]);
 };
 await add("padelrecs","nox-at10","Nox AT10 Genius",[
  ["research-p1","Has played it for a year and loves the control, but it cracked and they returned it.","positive","https://www.reddit.com/r/padel/comments/abc/x/def/","2026-11-10T00:00:00Z"],
  ["research-p2","Great sweet spot, recommends it to intermediate players.","positive","https://www.reddit.com/r/padel/comments/ghi/","2026-11-01T00:00:00Z"],
 ]);
 await add("skinrecs","cerave-cleanser","CeraVe Hydrating Cleanser",[
  ["research-s1","Excellent and gentle, loves it, would recommend it to anyone with dry skin.","negative","https://www.reddit.com/r/SkincareAddiction/comments/jkl/","2026-09-01T00:00:00Z"],
  ["research-s2","Broke them out within a week.","negative","https://www.reddit.com/r/SkincareAddiction/comments/mno/","2026-11-11T00:00:00Z"],
 ]);
 const sites=reviewSites({padel:"padelrecs",skin:"skinrecs"});
 return {engine,db:drizzle(engine),sites};
}

test("the finder searches every site by words, link, id and filters, and lists doubtful labels first",async()=>{
 const {engine,db,sites}=await twoSites();
 try{
  const find=async(q:Record<string,string>)=>(await searchReviews(db,searchInput.parse(q),sites,new Date("2026-11-12T00:00:00Z"))).rows.map(r=>`${r.site}:${r.id}`);
  assert.deepEqual(await find({}),["skin:research-s2","padel:research-p1","padel:research-p2","skin:research-s1"]);
  assert.deepEqual(await find({q:"nox control"}),["padel:research-p1"]);
  assert.deepEqual(await find({q:"cerave"}),["skin:research-s2","skin:research-s1"]);
  // A pasted link matches without www. and without a query string or trailing slash.
  assert.deepEqual(await find({q:"https://reddit.com/r/padel/comments/abc/x/def?utm_source=share"}),["padel:research-p1"]);
  assert.deepEqual(await find({q:"research-s1"}),["skin:research-s1"]);
  assert.deepEqual(await find({site:"padel",sentiment:"positive"}),["padel:research-p1","padel:research-p2"]);
  assert.deepEqual(await find({days:"7"}),["skin:research-s2","padel:research-p1"]);
  assert.deepEqual(await find({q:"100%_off"}),[]);
  assert.deepEqual(await find({check:"doubt"}),["skin:research-s1","padel:research-p1"]);
  // Fixing a label marks the review as edited, so it leaves the doubtful list (confirming the same label does too).
  assert.equal(await setSentiment(db,{site:"padel",id:"research-p1",sentiment:"mixed"},sites),"saved");
  assert.equal(await setSentiment(db,{site:"skin",id:"research-s1",sentiment:"negative"},sites),"saved");
  assert.equal(await setSentiment(db,{site:"skin",id:"research-p1",sentiment:"mixed"},sites),"missing");
  assert.equal(await setSentiment(db,{site:"nope",id:"research-p1",sentiment:"mixed"},sites),"invalid");
  assert.deepEqual(await find({check:"doubt"}),[]);
  const [p1]=(await engine.query<{sentiment:string;admin_edited_at:string|null}>("select sentiment,admin_edited_at from padelrecs.external_reviews where id='research-p1'")).rows;
  assert.equal(p1.sentiment,"mixed");assert.ok(p1.admin_edited_at);
  const [s1]=(await engine.query<{sentiment:string}>("select sentiment from skinrecs.external_reviews where id='research-s1'")).rows;
  assert.equal(s1.sentiment,"negative");
 }finally{await engine.close();}
});

test("only schemas recorded for a known niche are searched, and links point at the review's own site",()=>{
 assert.deepEqual(reviewSites({padel:"padelrecs",skin:"padelrecs",unknown:"unknownrecs"}).map(s=>s.id),["padel"]);
 assert.equal(reviewSites().length,30);
 const [skin]=reviewSites({skin:"skinrecs"});
 const links=reviewLinks(skin,{id:"research-1",slug:"cerave-cleanser",shape:null},{id:"padel"});
 assert.match(links.edit,/^https:\/\/www\.skinrecs\.com\/funtimes\/edit-review\?type=web&id=research-1$/);
 assert.match(links.product,/^https:\/\/www\.skinrecs\.com\//);
 assert.equal(reviewLinks(skin,{id:"research-1",slug:"x",shape:null},{id:"skin"}).edit,"/funtimes/edit-review?type=web&id=research-1");
});

test("publishing keeps a review the owner edited in the admin instead of restoring the queue's version",()=>{
 const candidate={id:"c1",status:"published",racket_name:"Nox AT10 Genius",source_platform:"Reddit",source_name:"r/padel",source_url:"https://www.reddit.com/r/padel/comments/abc/",summary:"Has played it for a year and loves it, but it cracked.",sentiment:"positive",tags:[]} as unknown as Parameters<typeof planImport>[0][number];
 const live={id:webReviewId("c1"),racketId:"nox",sourceUrl:candidate.source_url,excerpt:null,summary:candidate.summary!,sentiment:"mixed" as const,tags:[]};
 const site=(adminEditedAt:string|null)=>({rackets:[{id:"nox",name:"Nox AT10 Genius"}],external:[{...live,adminEditedAt}]});
 assert.equal(planImport([candidate],site(null),niches.padel).updates.length,1);
 const kept=planImport([candidate],site("2026-11-12T10:00:00Z"),niches.padel);
 assert.equal(kept.updates.length,0);
 assert.deepEqual(kept.kept,[{candidateId:"c1",id:webReviewId("c1")}]);
});
