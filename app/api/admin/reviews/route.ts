import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { database } from "../../../../db/data";
import { reviews } from "../../../../db/schema";
import { revalidateSite } from "../../../../lib/revalidate";
import { adminWriteGuard, adminRedirect, readAdminForm } from "../../../admin/auth";
const status=z.enum(["pending","approved","rejected"]);
const input=z.object({id:z.string().min(1).max(100),status,expectedStatus:status,returnStatus:status});
export async function POST(request:Request) {
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 let parsed;try{parsed=input.safeParse(await readAdminForm(request));}catch{return adminRedirect(request,"result=invalid");}
 if(!parsed.success || parsed.data.id.startsWith("demo-")) return adminRedirect(request,"result=invalid");
 const value=parsed.data,query=`status=${value.returnStatus}`;
 try {
  const db=await database();
  const updated=await db.update(reviews).set({status:value.status}).where(and(eq(reviews.id,value.id),eq(reviews.status,value.expectedStatus))).returning({id:reviews.id});
  if(updated.length)revalidateSite();
  return adminRedirect(request,`${query}&result=${updated.length?value.status:"stale"}`);
 }catch {return adminRedirect(request,`${query}&result=failed`);}
}
