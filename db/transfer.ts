import { z } from "zod";
import { brands, rackets, reviews, externalReviews, racketSlugRedirects } from "./schema";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";
import { SOURCE_SCHEMA } from "./migrations";
const nullable=z.string().nullable();
const category=z.number().int().min(1).max(5).nullable();
const identity={id:z.string().min(1)};
const racketId={racket_id:z.string().min(1)};
const date={created_at:z.string().datetime({offset:true})};
const tags={tags:z.array(z.string()).optional()};
const tables=z.object({
 brands:z.array(z.object({...identity,name:z.string().min(1),slug:z.string().min(1)}).strict()),
 rackets:z.array(z.object({...identity,brand_id:z.string().min(1),name:z.string().min(1),slug:z.string().min(1),year:z.number().int(),image_url:nullable,shape:nullable,weight:nullable,balance:nullable,surface:nullable,core:nullable,description:nullable,
  // Optional so snapshots taken before product links existed still import.
  website_url:nullable.optional(),affiliate_url:nullable.optional(),...date}).strict()),
 reviews:z.array(z.object({...identity,...racketId,rating:z.number().int().min(1).max(5),power_rating:category,control_rating:category,maneuverability_rating:category,comfort_rating:category,forgiveness_rating:category,player_level:nullable,playing_side:nullable,playing_style:nullable,time_with_racket:nullable,review_text:z.string(),alias:nullable,email:nullable,status:z.enum(["pending","approved","rejected"]),...tags,...date}).strict()),
 external_reviews:z.array(z.object({...identity,...racketId,excerpt:nullable,summary:nullable.optional(),source_language:nullable.optional(),excerpt_translation:nullable.optional(),sentiment:z.enum(["positive","negative","mixed"]).nullable().optional(),source_platform:z.string(),source_name:z.string(),source_url:z.string(),source_date:nullable,external_rating:z.number().int().nullable(),...tags,...date}).strict()),
 // Optional so snapshots taken before slug redirects existed still import.
 racket_slug_redirects:z.array(z.object({slug:z.string().min(1),...racketId,...date}).strict()).optional()
}).strict();
const format=z.object({formatVersion:z.literal(1),source:z.string(),exportedAt:z.string().datetime(),tables}).strict();
export type Snapshot=z.infer<typeof format>;
/** Snapshots name the schema they came from ("supabase:<ref>#<schema>"); older ones without it came from padelrecs. */
export const snapshotSource=(origin:string,schema:string)=>`${origin}#${schema}`;
export const snapshotSchema=(snapshot:Pick<Snapshot,"source">)=>snapshot.source.match(/#([a-z][a-z0-9_]*)$/)?.[1]??SOURCE_SCHEMA;
export function parseSnapshot(raw:unknown):Snapshot {
 const snapshot=format.parse(raw),t=snapshot.tables;
 for(const name of ["brands","rackets","reviews","external_reviews"] as const){
  if(new Set(t[name].map(r=>r.id)).size!==t[name].length)throw new Error(`Duplicate IDs in ${name}`);
 }
 const redirectSlugs=(t.racket_slug_redirects??[]).map(r=>r.slug);
 if(new Set(redirectSlugs).size!==redirectSlugs.length)throw new Error("Duplicate slugs in racket_slug_redirects");
 for(const name of ["brands","rackets"] as const)if(new Set(t[name].map(r=>r.slug)).size!==t[name].length)throw new Error(`Duplicate slugs in ${name}`);
 const brandIds=new Set(t.brands.map(r=>r.id)),racketIds=new Set(t.rackets.map(r=>r.id));
 if(t.rackets.some(r=>!brandIds.has(r.brand_id)))throw new Error("Snapshot contains a racket with a missing brand");
 if([...t.reviews,...t.external_reviews,...(t.racket_slug_redirects??[])].some(r=>!racketIds.has(r.racket_id)))throw new Error("Snapshot contains a review with a missing racket");
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
  externalReviews:snapshot.tables.external_reviews.map(camel) as typeof externalReviews.$inferSelect[],
  slugRedirects:(snapshot.tables.racket_slug_redirects??[]).map(camel) as typeof racketSlugRedirects.$inferSelect[]
 };
}
// Any Drizzle Postgres driver: the site (node-postgres), db:import (postgres.js) and tests (PGlite).
type Database=PgDatabase<PgQueryResultHKT,typeof schema>;
type Reader=Pick<Database,"select">;
export async function verifySnapshot(db:Reader,snapshot:Snapshot){
 const expected=normalized(snapshot);
 const actual={brands:await db.select().from(brands),rackets:await db.select().from(rackets),reviews:await db.select().from(reviews),externalReviews:await db.select().from(externalReviews)};
 const counts:Record<string,number>={};
 for(const key of ["brands","rackets","reviews","externalReviews"] as const){
  const found=new Map(actual[key].map(row=>[row.id,row as unknown as Record<string,unknown>]));
  for(const row of expected[key]){
   const stored=found.get(row.id);
   if(!stored||Object.entries(row).some(([field,value])=>Array.isArray(value)?JSON.stringify(stored[field])!==JSON.stringify(value):stored[field]!==value))throw new Error(`Data mismatch in ${key}, ID ${row.id}; import has not overwritten existing data`);
  }
  counts[key]=expected[key].length;
 }
 const redirects=new Map((await db.select().from(racketSlugRedirects)).map(row=>[row.slug,row]));
 for(const row of expected.slugRedirects){
  const stored=redirects.get(row.slug);
  if(!stored||stored.racketId!==row.racketId||stored.createdAt!==row.createdAt)throw new Error(`Data mismatch in slugRedirects, slug ${row.slug}; import has not overwritten existing data`);
 }
 if(expected.slugRedirects.length)counts.slugRedirects=expected.slugRedirects.length;
 return counts;
}
export async function importSnapshot(db:Database,snapshot:Snapshot){
 const data=normalized(snapshot);
 return db.transaction(async tx=>{
  for(let i=0;i<data.brands.length;i+=50)await tx.insert(brands).values(data.brands.slice(i,i+50)).onConflictDoNothing({target:brands.id});
  for(let i=0;i<data.rackets.length;i+=50)await tx.insert(rackets).values(data.rackets.slice(i,i+50)).onConflictDoNothing({target:rackets.id});
  for(let i=0;i<data.reviews.length;i+=50)await tx.insert(reviews).values(data.reviews.slice(i,i+50)).onConflictDoNothing({target:reviews.id});
  for(let i=0;i<data.externalReviews.length;i+=50)await tx.insert(externalReviews).values(data.externalReviews.slice(i,i+50)).onConflictDoNothing({target:externalReviews.id});
  for(let i=0;i<data.slugRedirects.length;i+=50)await tx.insert(racketSlugRedirects).values(data.slugRedirects.slice(i,i+50)).onConflictDoNothing({target:racketSlugRedirects.slug});
  // An existing same-ID/different-value row aborts the whole import. Nothing gets overwritten.
  return verifySnapshot(tx,snapshot);
 });
}
