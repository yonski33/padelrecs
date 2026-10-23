import {database} from "../../../../db/data";
import {reviewEditInput,saveReviewEdit} from "../../../../db/review-editing";
import {adminWriteGuard,adminRedirect,readAdminForm} from "../../../funtimes/auth";
import {siteOrigin} from "../../../../lib/site-url";

export async function POST(request:Request){
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 let raw;try{raw=await readAdminForm(request);}catch{return adminRedirect(request,"result=edit-invalid");}
 const parsed=reviewEditInput.safeParse(raw);
 const editError=(result:string)=>new Response(null,{status:303,headers:{Location:`${siteOrigin(request.url)}/funtimes/edit-review?type=${raw.type==="web"?"web":"player"}&id=${encodeURIComponent((raw.id||"").slice(0,100))}&result=${result}`,"Cache-Control":"no-store"}});
 if(!parsed.success)return editError("invalid");
 try{
  const value=parsed.data,result=await saveReviewEdit(await database(),value);
  if(result!=="saved")return editError(result);
  const status=["pending","approved","rejected"].includes(raw.returnStatus)?raw.returnStatus:"pending";
  return adminRedirect(request,`${value.type==="web"?"tab=web":`status=${status}`}&result=edit-saved`);
 }catch{return editError("failed");}
}
