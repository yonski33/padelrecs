import { createClient } from "../../../lib/supabase/server";
import { siteOrigin } from "../../../lib/site-url";
import { z } from "zod";
export async function POST(request:Request) {
 const origin=siteOrigin(request.url);
 if(request.headers.get("origin")!==origin)return Response.json({error:"Invalid origin"},{status:403});
 const form=await request.formData();const parsed=z.string().trim().email().max(254).safeParse(form.get("email"));
 const client=await createClient();
 let failed=!parsed.success||!client;
 if(parsed.success&&client){const {error}=await client.auth.signInWithOtp({email:parsed.data,options:{shouldCreateUser:false,emailRedirectTo:`${origin}/auth/callback`}});failed=!!error;}
 return new Response(null,{status:303,headers:{Location:`${origin}/admin/login?result=${failed?"error":"sent"}`,"Cache-Control":"no-store"}});
}
