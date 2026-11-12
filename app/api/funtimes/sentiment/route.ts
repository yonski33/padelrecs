import {database} from "../../../../db/data";
import {sentimentInput,setSentiment} from "../../../../db/review-search";
import {adminWriteGuard,readAdminForm} from "../../../funtimes/auth";

/** One-click sentiment from the review finder (app/funtimes/finder.tsx). Answers JSON; the buttons update in place. */
export async function POST(request:Request){
 const forbidden=await adminWriteGuard(request);if(forbidden)return forbidden;
 const json=(body:object,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
 let raw;try{raw=await readAdminForm(request);}catch{return json({error:"invalid"},400);}
 const parsed=sentimentInput.safeParse(raw);
 if(!parsed.success)return json({error:"invalid"},400);
 try{
  const result=await setSentiment(await database(),parsed.data);
  return result==="saved"?json({ok:true,sentiment:parsed.data.sentiment}):json({error:result},result==="missing"?404:400);
 }catch{return json({error:"failed"},500);}
}
