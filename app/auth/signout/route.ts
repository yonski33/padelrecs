import { createClient } from "../../../lib/supabase/server";
import { siteOrigin } from "../../../lib/site-url";
export async function POST(request:Request) {
 const origin=siteOrigin(request.url);
 if(request.headers.get("origin")!==origin)return Response.json({error:"Invalid origin"},{status:403});
 const client=await createClient();if(client)await client.auth.signOut();
 return Response.redirect(`${origin}/`,303);
}
