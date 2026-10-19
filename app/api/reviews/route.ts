import { siteOrigin } from "../../../lib/site-url";
import { niche } from "../../../lib/niche";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../db/data";
import { racketSelection, ensureRacket } from "../../../db/racket-selection";
import { reviews, rackets } from "../../../db/schema";
import { tagsInput } from "../../../lib/tags";
import { profileChoice } from "../../../lib/review-options";
const rating=z.coerce.number().int().min(1).max(5);
const optionalRating=z.preprocess(v=>v===""||v===null?undefined:v,rating.optional());
const input=z.object({
 rating,
 powerRating:optionalRating,controlRating:optionalRating,maneuverabilityRating:optionalRating,comfortRating:optionalRating,forgivenessRating:optionalRating,
 playerLevel:profileChoice("playerLevel").optional(),playingSide:profileChoice("playingSide").optional(),playingStyle:profileChoice("playingStyle").optional(),timeWithRacket:profileChoice("timeWithRacket").optional(),
 reviewText:z.string().trim().min(20),tags:tagsInput,alias:z.string().trim().max(50).optional(),email:z.union([z.literal(""),z.string().trim().email().max(254)]).optional()
}).and(racketSelection);
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==siteOrigin(request.url))return Response.json({error:"Please submit from the review form."},{status:403});
 let body;try{const raw=await request.text();body=JSON.parse(raw);}catch{return Response.json({error:"Invalid review submission."},{status:400});}
 const parsed=input.safeParse({racketMode:"existing",...body});if(!parsed.success)return Response.json({error:`Check the ${niche.words.one} details (brand, model and year for a new ${niche.words.one}), rating, email, and review text (at least 20 characters).`},{status:400});
 try {
  const db=await database(),value=parsed.data;
  const review={id:crypto.randomUUID(),rating:value.rating,powerRating:value.powerRating,controlRating:value.controlRating,maneuverabilityRating:value.maneuverabilityRating,comfortRating:value.comfortRating,forgivenessRating:value.forgivenessRating,playerLevel:value.playerLevel,playingSide:value.playingSide,playingStyle:value.playingStyle,timeWithRacket:value.timeWithRacket,reviewText:value.reviewText,tags:value.tags,email:value.email||null,alias:value.alias||null,status:"pending" as const,createdAt:new Date().toISOString()};
  if(value.racketMode==="existing") {
   const [racket]=await db.select({id:rackets.id}).from(rackets).where(eq(rackets.id,value.racketId));
   if(!racket)return Response.json({error:`Choose a listed ${niche.words.one} or select New ${niche.words.one}.`},{status:400});
   await db.insert(reviews).values({...review,racketId:racket.id});
  } else {
   await db.transaction(async tx=>{
    const racketId=await ensureRacket(tx,value,review.createdAt);
    await tx.insert(reviews).values({...review,racketId});
   });
  }
  return Response.json({status:"pending"},{status:201});
 }catch(error){console.error("Review save failed",error);return Response.json({error:"Could not save the review. Please try again."},{status:500});}
}
