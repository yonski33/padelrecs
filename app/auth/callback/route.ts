import { createClient } from "../../../lib/supabase/server";
import { siteOrigin } from "../../../lib/site-url";
export async function GET(request:Request) {
 const code=new URL(request.url).searchParams.get("code"),client=await createClient();
 if(code&&client){const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return Response.redirect(`${siteOrigin(request.url)}/admin`,303);}
 return Response.redirect(`${siteOrigin(request.url)}/admin/login?result=error`,303);
}
