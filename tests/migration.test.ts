import {test} from "node:test";
import assert from "node:assert/strict";
import {migrationSql} from "../db/migrations";
import {PGlite} from "@electric-sql/pglite";
import {drizzle} from "drizzle-orm/pglite";
import {eq,sql} from "drizzle-orm";
import {fixture} from "./fixture";
import {parseSnapshot,importSnapshot,verifySnapshot} from "../db/transfer";
import {brands,rackets,reviews,externalReviews} from "../db/schema";
import {ensureRacket,type CatalogTransaction} from "../db/racket-selection";
import {catalog,score} from "../db/data";
import type {getDb} from "../db/index";
import {allowedAdmin} from "../lib/admin-access";
import {adminWriteGuard} from "../app/admin/auth";

type Database=ReturnType<typeof getDb>;
async function setup(){
 const engine=new PGlite();
 for(const statement of migrationSql("padelrecs"))await engine.exec(statement);
 const db=drizzle(engine);
 return {engine,db,portable:db as unknown as Database};
}
test("snapshot rejects missing references, duplicates and retired dummy reviews",()=>{
 assert.equal(parseSnapshot(fixture).tables.reviews.length,2);
 const missing=structuredClone(fixture);missing.tables.rackets[0].brand_id="missing";
 assert.throws(()=>parseSnapshot(missing),/missing brand/);
 const duplicates=structuredClone(fixture);duplicates.tables.brands.push({...duplicates.tables.brands[0]});
 assert.throws(()=>parseSnapshot(duplicates),/Duplicate IDs/);
 const retired=structuredClone(fixture);retired.tables.reviews[0].id="demo-review-0";
 assert.throws(()=>parseSnapshot(retired),/fictional reviews/);
});
test("PostgreSQL import preserves all values, pending status and long text; public feed omits email and pending reviews",async()=>{
 const {engine,db,portable}=await setup();try{
  const snapshot=parseSnapshot(fixture);
  await importSnapshot(portable,snapshot);
  await importSnapshot(portable,snapshot);
  assert.deepEqual(await verifySnapshot(portable,snapshot),{brands:1,rackets:1,reviews:2,externalReviews:1});
  const publicData=await catalog(portable);
  assert.equal(publicData.reviews.length,1);assert.equal(publicData.reviews[0].id,"approved-review");
  assert.equal(score(publicData,"racket-nox").average,"4.0");
  assert(!JSON.stringify(publicData).includes("private@example.test"));
  assert(!JSON.stringify(publicData).includes("pending@example.test"));
  assert(publicData.reviews[0].reviewText.length>20000);assert(publicData.external[0].excerpt.length>20000);
  const pending=await db.select().from(reviews).where(eq(reviews.id,"pending-review"));assert.equal(pending[0].status,"pending");
 }finally{await engine.close();}
});
test("import conflict aborts atomically without overwriting existing records",async()=>{
 const {engine,portable}=await setup();try{
  const snapshot=parseSnapshot(fixture);await importSnapshot(portable,snapshot);
  const conflict=structuredClone(snapshot);
  conflict.tables.brands[0].name="Changed outside migration";
  conflict.tables.brands.push({id:"new-brand",name:"Must roll back",slug:"rollback"});
  await assert.rejects(importSnapshot(portable,conflict),/Data mismatch/);
  assert.deepEqual(await verifySnapshot(portable,snapshot),{brands:1,rackets:1,reviews:2,externalReviews:1});
  assert.equal((await portable.select().from(brands)).length,1);
 }finally{await engine.close();}
});
test("new rackets share a real PostgreSQL transaction with the review, reuse slugs and roll back on failure",async()=>{
 const {engine,db,portable}=await setup();try{
  await importSnapshot(portable,parseSnapshot(fixture));
  const value={racketMode:"new" as const,brandName:"Bullpadel",modelName:"Vertex 05",year:2026};
  await assert.rejects(db.transaction(async tx=>{await ensureRacket(tx as unknown as CatalogTransaction,value,"2026-10-17T03:00:00Z");throw new Error("abort");}),/abort/);
  assert.equal((await db.select().from(brands)).length,1);
  const ids:string[]=[];
  for(let i=0;i<2;i++)await db.transaction(async tx=>{
   const racketId=await ensureRacket(tx as unknown as CatalogTransaction,value,"2026-10-17T03:00:00Z");ids.push(racketId);
   await tx.insert(reviews).values({id:`new-review-${i}`,racketId,rating:5,reviewText:"New racket test review.",status:"pending",createdAt:"2026-10-17T03:00:00Z"});
  });
  assert.equal(ids[0],ids[1]);assert.equal((await db.select().from(rackets)).length,2);
  const [racket]=await db.select().from(rackets).where(eq(rackets.id,ids[0]));
  await db.update(rackets).set({weight:"370 g",shape:"Diamond",core:"EVA test"}).where(eq(rackets.id,racket.id));
  const [updated]=await db.select().from(rackets).where(eq(rackets.id,racket.id));assert.equal(updated.slug,racket.slug);assert.equal(updated.core,"EVA test");
  assert.equal((await db.select().from(reviews).where(eq(reviews.racketId,racket.id))).length,2);
 }finally{await engine.close();}
});
test("RLS is enabled for all catalog tables and anonymous roles cannot read private review fields",async()=>{
 const {engine,portable}=await setup();try{
  await importSnapshot(portable,parseSnapshot(fixture));
  const result=await engine.query<{tablename:string,rowsecurity:boolean}>("select tablename,rowsecurity from pg_tables where schemaname='padelrecs'");
  assert.equal(result.rows.length,6);assert(result.rows.every(r=>r.rowsecurity));
  await engine.exec("CREATE ROLE anonymous_test; GRANT USAGE ON SCHEMA padelrecs TO anonymous_test; GRANT SELECT ON ALL TABLES IN SCHEMA padelrecs TO anonymous_test; SET ROLE anonymous_test;");
  const visible=await engine.query("select email from padelrecs.reviews");assert.equal(visible.rows.length,0);
  await engine.exec("RESET ROLE;");
 }finally{await engine.close();}
});
test("admin authorization uses verified Supabase user IDs, never spoofed Sites headers",async()=>{
 assert(!allowedAdmin(undefined,"owner-id"));assert(!allowedAdmin("other","owner-id"));assert(allowedAdmin("owner-id"," owner-id, second-id "));
 const previous={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
 delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 try{
  const request=new Request("http://localhost:3000/api/admin/reviews",{method:"POST",headers:{"oai-authenticated-user-id":"owner-id","oai-authenticated-user-email":"owner@example.test",origin:"http://localhost:3000","content-type":"application/x-www-form-urlencoded"},body:"id=anything"});
  assert.equal((await adminWriteGuard(request))?.status,403);
 }finally{
  if(previous.url)process.env.NEXT_PUBLIC_SUPABASE_URL=previous.url;
  if(previous.key)process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=previous.key;
 }
});
