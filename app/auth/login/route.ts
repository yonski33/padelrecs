import { createClient } from "../../../lib/supabase/server";
import { siteOrigin } from "../../../lib/site-url";
import { z } from "zod";
import {signInAdminWithPassword} from "../../../lib/admin-login";
export async function POST(request:Request) {
 const origin=siteOrigin(request.url);
 if(request.headers.get("origin")!==origin)return Response.json({error:"Invalid origin"},{status:403});
 const form=await request.formData();const parsed=z.string().trim().email().max(254).safeParse(form.get("email"));
 const passwordMode=form.get("method")==="password";
 const password=z.string().min(1).max(4096).safeParse(form.get("password"));
 let result=passwordMode?"password-error":"error",destination="/admin/login";
 if(parsed.success&&(!passwordMode||password.success)){
  const client=await createClient();
  if(client){
   if(passwordMode&&password.success){
    const outcome=await signInAdminWithPassword(client.auth,parsed.data,password.data,process.env.ADMIN_USER_IDS);
    if(outcome==="success"){destination="/admin";result="";}
    else result=outcome==="rate-limited"?"password-rate-limited":"password-error";
   }else{
    const {error}=await client.auth.signInWithOtp({email:parsed.data,options:{shouldCreateUser:false,emailRedirectTo:`${origin}/auth/callback`}});
    result=error?(error.status===429?"email-rate-limited":"error"):"sent";
   }
  }
 }
 return new Response(null,{status:303,headers:{Location:`${origin}${destination}${result?`?result=${result}`:""}`,"Cache-Control":"no-store"}});
}
