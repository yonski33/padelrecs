import { z } from "zod";
import { brands, rackets, reviews, externalReviews } from "./schema";
import type { getDb } from "./index";
const nullable=z.string().nullable();
const category=z.number().int().min(1).max(5).nullable();
const identity={id:z.string().min(1)};
const racketId={racket_id:z.string().min(1)};
const date={created_at:z.string().datetime({offset:true})};
const tables=z.object({
 brands:z.array(z.object({...identity,name:z.string().min(1),slug:z.string().min(1)}).strict()),
 rackets:z.array(z.object({...identity,brand_id:z.string().min(1),name:z.string().min(1),slug:z.string().min(1),year:z.number().int(),image_url:nullable,shape:nullable,weight:nullable,balance:nullable,surface:nullable,core:nullable,description:nullable,...date}).strict()),
 reviews:z.array(z.object({...identity,...racketId,rating:z.number().int().min(1).max(5),power_rating:category,control_rating:category,maneuverability_rating:category,comfort_rating:category,forgiveness_rating:category,player_level:nullable,playing_side:nullable,playing_style:nullable,time_with_racket:nullable,review_text:z.string(),alias:nullable,email:nullable,status:z.enum(["pending","approved","rejected"]),...date}).strict()),
 external_reviews:z.array(z.object({...identity,...racketId,excerpt:z.string(),source_platform:z.string(),source_name:z.string(),source_url:z.string(),source_date:nullable,external_rating:z.number().int().nullable(),...date}).strict())
}).strict();
const format=z.object({formatVersion:z.literal(1),source:z.string(),exportedAt:z.string().datetime(),tables}).strict();
export type Snapshot=z.infer<typeof format>;
export function parseSnapshot(raw:unknown):Snapshot {
 const snapshot=format.parse(raw),t=snapshot.tables;
 for(const [name,rows] of Object.entries(t)){
  if(new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error(`Duplicate IDs in ${name}`);
 }
 for(const name of ["brands","rackets"] as const)if(new Set(t[name].map(r=>r.slug)).size!==t[name].length)throw new Error(`Duplicate slugs in ${name}`);
 const brandIds=new Set(t.brands.map(r=>r.id)),racketIds=new Set(t.rackets.map(r=>r.id));
 if(t.rackets.some(r=>!brandIds.has(r.brand_id)))throw new Error("Snapshot contains a racket with a missing brand");
 if([...t.reviews,...t.external_reviews].some(r=>!racketIds.has(r.racket_id)))throw new Error("Snapshot contains a review with a missing racket");
 if(t.reviews.some(r=>/^demo-review-(?:[0-9]|1[0-4])$/.test(r.id))||t.external_reviews.some(r=>/^demo-external-[0-9]$/.test(r.id)))throw new Error("Snapshot includes retired fictional reviews");
 return snapshot;
}
function camel(row:Record<string,unknown>){return Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c:string)=>c.toUpperCase()),v]));}
export function normalized(snapshot:Snapshot){
 // Strict validation above defines every field before converting the original D1 column names.
 return {
  brands:snapshot.tables.brands.map(camel) as typeof brands.$inferSelect[],
  rackets:snapshot.tables.rackets.map(camel) as typeof rackets.$inferSelect[],
  reviews:snapshot.tables.reviews.map(camel) as typeof reviews.$inferSelect[],
  externalReviews:snapshot.tables.external_reviews.map(camel) as typeof externalReviews.$inferSelect[]
 };
}
type Database=ReturnType<typeof getDb>;
type Reader=Pick<Database,"select">;
export async function verifySnapshot(db:Reader,snapshot:Snapshot){
 const expected=normalized(snapshot);
 const actual={brands:await db.select().from(brands),rackets:await db.select().from(rackets),reviews:await db.select().from(reviews),externalReviews:await db.select().from(externalReviews)};
 const counts:Record<string,number>={};
 for(const key of ["brands","rackets","reviews","externalReviews"] as const){
  const found=new Map(actual[key].map(row=>[row.id,row as unknown as Record<string,unknown>]));
  for(const row of expected[key]){
   const stored=found.get(row.id);
   if(!stored||Object.entries(row).some(([field,value])=>stored[field]!==value))throw new Error(`Data mismatch in ${key}, ID ${row.id}; import has not overwritten existing data`);
  }
  counts[key]=expected[key].length;
 }
 return counts;
}
export async function importSnapshot(db:Database,snapshot:Snapshot){
 const data=normalized(snapshot);
 return db.transaction(async tx=>{
  for(let i=0;i<data.brands.length;i+=50)await tx.insert(brands).values(data.brands.slice(i,i+50)).onConflictDoNothing({target:brands.id});
  for(let i=0;i<data.rackets.length;i+=50)await tx.insert(rackets).values(data.rackets.slice(i,i+50)).onConflictDoNothing({target:rackets.id});
  for(let i=0;i<data.reviews.length;i+=50)await tx.insert(reviews).values(data.reviews.slice(i,i+50)).onConflictDoNothing({target:reviews.id});
  for(let i=0;i<data.externalReviews.length;i+=50)await tx.insert(externalReviews).values(data.externalReviews.slice(i,i+50)).onConflictDoNothing({target:externalReviews.id});
  // An existing same-ID/different-value row aborts the whole import. Nothing gets overwritten.
  return verifySnapshot(tx,snapshot);
 });
}
