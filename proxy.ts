import { assertAuthTarget } from "./lib/deployment-target";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session on the only paths that depend on who is signed in (see config.matcher).
// Proxy runs as a Node function in fra1, so public pages must stay outside the matcher: otherwise every visit would
// pass through Frankfurt before reaching the edge cache.
export async function proxy(request:NextRequest) {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.next();
 assertAuthTarget(url,process.env.SUPABASE_PROJECT_REF);
 let response=NextResponse.next({request});
 const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){
  values.forEach(({name,value})=>request.cookies.set(name,value));
  response=NextResponse.next({request});
  values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
 }}});
 await supabase.auth.getUser();
 response.headers.set("Cache-Control","private, no-store");
 return response;
}
export const config={matcher:["/admin/:path*","/auth/:path*","/api/admin/:path*"]};
