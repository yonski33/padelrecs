import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { reviews } from "../../../../db/schema";
import { adminWriteGuard, adminRedirect, adminJson, wantsJson, readAdminForm } from "../../../funtimes/auth";
const status=z.enum(["pending","approved","rejected"]);
const input=z.object({id:z.string().min(1).max(100),status,expectedStatus:status,returnStatus:status});
export async function POST(request:Request) {
 // The same admin check and origin check for both answers; JSON only changes what comes back (the row updates in place).
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 const json=wantsJson(request);
 let parsed;try{parsed=input.safeParse(await readAdminForm(request));}catch{return json?adminJson(request,{result:"invalid",error:"Could not read that request."},400):adminRedirect(request,"result=invalid");}
 if(!parsed.success || parsed.data.id.startsWith("demo-")) return json?adminJson(request,{result:"invalid",error:"That review can't be changed here."},400):adminRedirect(request,"result=invalid");
 const value=parsed.data,query=`status=${value.returnStatus}`;
 try {
  const db=await database();
  const updated=await db.update(reviews).set({status:value.status}).where(and(eq(reviews.id,value.id),eq(reviews.status,value.expectedStatus))).returning({id:reviews.id});
  if(json) return updated.length?adminJson(request,{result:value.status}):adminJson(request,{result:"stale",error:"This review changed since the page loaded. Reload to see its status."},409);
  return adminRedirect(request,`${query}&result=${updated.length?value.status:"stale"}`);
 }catch {return json?adminJson(request,{result:"failed",error:"Saving failed. Try again."},500):adminRedirect(request,`${query}&result=failed`);}
}
