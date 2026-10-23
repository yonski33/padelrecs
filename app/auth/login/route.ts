import { createClient } from "../../../lib/supabase/server";
import { siteOrigin } from "../../../lib/site-url";
import { z } from "zod";
import {signInAdminWithPassword} from "../../../lib/admin-login";
import {clientIp, createLimiter, createLoginThrottle} from "../../../lib/rate-limit";
// Brute-force guard (lib/rate-limit.ts): after 5 failed passwords per IP, or 10 per account, each further failure locks
// that key out for 1, 2, 4 … up to 60 minutes. Checked before Supabase is asked, so locked-out guesses cost nothing.
const ipFailures=createLoginThrottle({free:5}),emailFailures=createLoginThrottle({free:10});
// Sign-in link requests send email, so cap them per IP too.
const linkRequests=createLimiter({limit:5,windowMs:60*60_000});
export async function POST(request:Request) {
 const origin=siteOrigin(request.url);
 if(request.headers.get("origin")!==origin)return Response.json({error:"Invalid origin"},{status:403});
 const form=await request.formData();const parsed=z.string().trim().email().max(254).safeParse(form.get("email"));
 const passwordMode=form.get("method")==="password";
 const password=z.string().min(1).max(4096).safeParse(form.get("password"));
 let result=passwordMode?"password-error":"error",destination="/funtimes/login";
 const ip=`ip:${clientIp(request)}`;
 if(parsed.success&&(!passwordMode||password.success)){
  const client=await createClient();
  const account=`email:${parsed.data.toLowerCase()}`;
  if(passwordMode&&password.success){
   if(ipFailures.wait([ip])>0||emailFailures.wait([account])>0)result="password-rate-limited";
   else if(client){
    const outcome=await signInAdminWithPassword(client.auth,parsed.data,password.data,process.env.ADMIN_USER_IDS);
    if(outcome==="success"){destination="/funtimes";result="";ipFailures.succeed([ip]);emailFailures.succeed([account]);}
    else{
     if(outcome==="invalid"){ipFailures.fail([ip]);emailFailures.fail([account]);}
     result=outcome==="rate-limited"?"password-rate-limited":"password-error";
    }
   }
  }else if(!linkRequests.hit(ip))result="email-rate-limited";
  else if(client){
   const {error}=await client.auth.signInWithOtp({email:parsed.data,options:{shouldCreateUser:false,emailRedirectTo:`${origin}/auth/callback`}});
   result=error?(error.status===429?"email-rate-limited":"error"):"sent";
  }
 }else if(passwordMode)ipFailures.fail([ip]);
 return new Response(null,{status:303,headers:{Location:`${origin}${destination}${result?`?result=${result}`:""}`,"Cache-Control":"no-store"}});
}
