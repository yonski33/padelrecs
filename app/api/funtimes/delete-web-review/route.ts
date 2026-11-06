import {z} from "zod";
import {database} from "../../../../db/data";
import {deleteWebReview} from "../../../../db/review-editing";
import {adminWriteGuard,adminRedirect,readAdminForm} from "../../../funtimes/auth";

const input=z.object({id:z.string().min(1).max(200),page:z.coerce.number().int().min(1).max(100000).catch(1)});
export async function POST(request:Request){
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 let parsed;try{parsed=input.safeParse(await readAdminForm(request));}catch{return adminRedirect(request,"tab=web&result=failed");}
 if(!parsed.success)return adminRedirect(request,"tab=web&result=missing");
 const {id,page}=parsed.data,list=`tab=web${page>1?`&page=${page}`:""}`;
 try{
  const result=await deleteWebReview(await database(),id);
  return adminRedirect(request,`${list}&result=${result==="deleted"?"web-deleted":"missing"}`);
 }catch{return adminRedirect(request,`${list}&result=failed`);}
}
