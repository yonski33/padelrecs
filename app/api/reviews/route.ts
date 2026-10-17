import { siteOrigin } from "../../../lib/site-url";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../db/data";
import { racketSelection, ensureRacket } from "../../../db/racket-selection";
import { reviews, rackets } from "../../../db/schema";
const rating=z.coerce.number().int().min(1).max(5);
const optionalRating=z.preprocess(v=>v===""||v===null?undefined:v,rating.optional());
const choice=(values:[string,...string[]])=>z.union([z.literal(""),z.enum(values)]).optional();
const input=z.object({
 rating,
 powerRating:optionalRating,controlRating:optionalRating,maneuverabilityRating:optionalRating,comfortRating:optionalRating,forgivenessRating:optionalRating,
 playerLevel:choice(["Beginner","Intermediate","Advanced","Competitive"]),playingSide:choice(["Left","Right","Both"]),playingStyle:choice(["Defensive","All-round","Attacking"]),timeWithRacket:choice(["Tried briefly","Less than 1 month","1–6 months","6–12 months","More than 1 year"]),
 reviewText:z.string().trim().min(20),alias:z.string().trim().max(50).optional(),email:z.union([z.literal(""),z.string().trim().email().max(254)]).optional()
}).and(racketSelection);
export async function POST(request:Request){
 const origin=request.headers.get("origin");if(origin&&origin!==siteOrigin(request.url))return Response.json({error:"Please submit from the review form."},{status:403});
 let body;try{const raw=await request.text();body=JSON.parse(raw);}catch{return Response.json({error:"Invalid review submission."},{status:400});}
 const parsed=input.safeParse({racketMode:"existing",...body});if(!parsed.success)return Response.json({error:"Check the racket details (brand, model and year for a new racket), rating, email, and review text (at least 20 characters)."},{status:400});
 try {
  const db=await database(),value=parsed.data;
  const review={id:crypto.randomUUID(),rating:value.rating,powerRating:value.powerRating,controlRating:value.controlRating,maneuverabilityRating:value.maneuverabilityRating,comfortRating:value.comfortRating,forgivenessRating:value.forgivenessRating,playerLevel:value.playerLevel,playingSide:value.playingSide,playingStyle:value.playingStyle,timeWithRacket:value.timeWithRacket,reviewText:value.reviewText,email:value.email||null,alias:value.alias||null,status:"pending" as const,createdAt:new Date().toISOString()};
  if(value.racketMode==="existing") {
   const [racket]=await db.select({id:rackets.id}).from(rackets).where(eq(rackets.id,value.racketId));
   if(!racket)return Response.json({error:"Choose a listed racket or select New racket."},{status:400});
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
