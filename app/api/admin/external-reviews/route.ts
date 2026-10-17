import { z } from "zod";
import { eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { racketSelection, ensureRacket } from "../../../../db/racket-selection";
import { rackets, externalReviews } from "../../../../db/schema";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../admin/auth";
const sourceUrl=z.string().trim().max(2000).url().refine(value=>{const url=new URL(value);return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password;});
const sourceDate=z.union([z.literal(""),z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d=>{const date=new Date(d);return !isNaN(date.getTime())&&date.toISOString().slice(0,10)===d;})]);
const input=z.object({excerpt:z.string().trim().min(20),sourcePlatform:z.enum(["Reddit","YouTube","Padel shop","Forum","Other"]),sourceName:z.string().trim().min(1).max(120),sourceUrl,sourceDate}).and(racketSelection);
export async function POST(request:Request) {
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 let parsed;try{parsed=input.safeParse({racketMode:"existing",...await readAdminForm(request)});}catch{return adminRedirect(request,"tab=web&result=invalid");}
 if(!parsed.success)return adminRedirect(request,"tab=web&result=invalid");
 try {
  const db=await database(),value=parsed.data;
  const review={id:crypto.randomUUID(),excerpt:value.excerpt,sourcePlatform:value.sourcePlatform,sourceName:value.sourceName,sourceUrl:value.sourceUrl,sourceDate:value.sourceDate||null,externalRating:null,createdAt:new Date().toISOString()};
  if(value.racketMode==="existing") {
   const [racket]=await db.select({id:rackets.id}).from(rackets).where(eq(rackets.id,value.racketId));
   if(!racket)return adminRedirect(request,"tab=web&result=invalid");
   await db.insert(externalReviews).values({...review,racketId:racket.id});
  } else {
   await db.transaction(async tx=>{
    const racketId=await ensureRacket(tx,value,review.createdAt);
    await tx.insert(externalReviews).values({...review,racketId});
   });
  }
  return adminRedirect(request,"tab=web&result=web");
 }catch{return adminRedirect(request,"tab=web&result=failed");}
}
