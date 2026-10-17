import "server-only";
import { createClient } from "./server";
export async function getCurrentUser() {
 const supabase=await createClient();
 if(!supabase)return null;
 // getUser verifies with Supabase Auth; never authorize from unverified cookies or request headers.
 const {data,error}=await supabase.auth.getUser();
 return error?null:data.user;
}
