import {z} from "zod";
import {database} from "../../../../db/data";
import {deleteRejectedReviews} from "../../../../db/review-editing";
import {adminWriteGuard,adminRedirect,adminJson,wantsJson,readAdminForm} from "../../../funtimes/auth";

// Permanent delete of rejected reviews (owner 2026-11-18): one id, or every rejected review on this site ("all=yes").
// Same admin + origin checks as reject/restore; only rows that are rejected right now can be deleted (rejectedOnly).
const input=z.union([z.object({all:z.literal("yes")}),z.object({id:z.string().min(1).max(100)})]);
export async function POST(request:Request){
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 const json=wantsJson(request),back="status=rejected";
 let parsed;try{parsed=input.safeParse(await readAdminForm(request));}catch{parsed=null;}
 if(!parsed?.success)return json?adminJson(request,{result:"invalid",error:"Could not read that request."},400):adminRedirect(request,`${back}&result=invalid`);
 const value=parsed.data;
 if("id" in value&&value.id.startsWith("demo-"))return json?adminJson(request,{result:"invalid",error:"That review can't be deleted here."},400):adminRedirect(request,`${back}&result=invalid`);
 try{
  const removed=await deleteRejectedReviews(await database(),"all" in value?"all":[value.id]);
  // A single id that isn't rejected (any more) deletes nothing: say so instead of pretending.
  if("id" in value&&!removed.length)return json?adminJson(request,{result:"stale",error:"Only rejected reviews can be deleted. Reload to see its status."},409):adminRedirect(request,`${back}&result=stale`);
  return json?adminJson(request,{result:"deleted",count:removed.length}):adminRedirect(request,`${back}&result=deleted&n=${removed.length}`);
 }catch{return json?adminJson(request,{result:"failed",error:"Deleting failed. Try again."},500):adminRedirect(request,`${back}&result=failed`);}
}
