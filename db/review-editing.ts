import {createHash} from "node:crypto";
import {eq} from "drizzle-orm";
import {z} from "zod";
import type {getDb} from "./index";
import {reviews,externalReviews,rackets} from "./schema";
import {tagsInput} from "../lib/tags";
import {profileChoice,sourcePlatform} from "../lib/review-options";

const rating=z.coerce.number().int().min(1).max(5);
const optionalRating=z.preprocess(v=>v===""||v===undefined?null:v,rating.nullable());
const common={id:z.string().min(1).max(100),revision:z.string().regex(/^[a-f0-9]{64}$/),racketId:z.string().min(1).max(100),tags:tagsInput};
const sourceDate=z.union([z.literal(""),z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d=>{const date=new Date(d);return !isNaN(date.getTime())&&date.toISOString().slice(0,10)===d;})]);
export const reviewEditInput=z.discriminatedUnion("type",[
 z.object({...common,type:z.literal("player"),rating,reviewText:z.string().trim().min(20),alias:z.string().trim().max(50),email:z.union([z.literal(""),z.string().trim().email().max(254)]),
 powerRating:optionalRating,controlRating:optionalRating,maneuverabilityRating:optionalRating,comfortRating:optionalRating,forgivenessRating:optionalRating,
 playerLevel:profileChoice("playerLevel"),playingSide:profileChoice("playingSide"),playingStyle:profileChoice("playingStyle"),timeWithRacket:profileChoice("timeWithRacket")}),
 z.object({...common,type:z.literal("web"),excerpt:z.string().trim().min(20),sourcePlatform,sourceName:z.string().trim().min(1).max(120),
 sourceUrl:z.string().trim().max(2000).url().refine(value=>{const u=new URL(value);return ["http:","https:"].includes(u.protocol)&&!u.username&&!u.password;}),sourceDate})
]);
export type ReviewEditInput=z.infer<typeof reviewEditInput>;
export function reviewRevision(row:object){return createHash("sha256").update(JSON.stringify(Object.entries(row).sort(([a],[b])=>a.localeCompare(b)))).digest("hex");}

export async function saveReviewEdit(db:ReturnType<typeof getDb>,value:ReviewEditInput){
 return db.transaction(async tx=>{
  if(value.type==="player"){
   const [current]=await tx.select().from(reviews).where(eq(reviews.id,value.id)).for("update");
   if(!current)return "missing";
   if(reviewRevision(current)!==value.revision)return "stale";
   const [racket]=await tx.select({id:rackets.id}).from(rackets).where(eq(rackets.id,value.racketId));
   if(!racket)return "invalid";
   await tx.update(reviews).set({racketId:value.racketId,rating:value.rating,reviewText:value.reviewText,alias:value.alias||null,email:value.email||null,
    powerRating:value.powerRating,controlRating:value.controlRating,maneuverabilityRating:value.maneuverabilityRating,comfortRating:value.comfortRating,forgivenessRating:value.forgivenessRating,
    playerLevel:value.playerLevel||null,playingSide:value.playingSide||null,playingStyle:value.playingStyle||null,timeWithRacket:value.timeWithRacket||null,tags:value.tags}).where(eq(reviews.id,value.id));
  }else{
   const [current]=await tx.select().from(externalReviews).where(eq(externalReviews.id,value.id)).for("update");
   if(!current)return "missing";
   if(reviewRevision(current)!==value.revision)return "stale";
   const [racket]=await tx.select({id:rackets.id}).from(rackets).where(eq(rackets.id,value.racketId));
   if(!racket)return "invalid";
   await tx.update(externalReviews).set({racketId:value.racketId,excerpt:value.excerpt,sourcePlatform:value.sourcePlatform,sourceName:value.sourceName,sourceUrl:value.sourceUrl,sourceDate:value.sourceDate||null,tags:value.tags}).where(eq(externalReviews.id,value.id));
  }
  return "saved";
 });
}
