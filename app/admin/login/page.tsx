import { redirect } from "next/navigation";
import { isAdmin } from "../auth";
export const dynamic="force-dynamic";
export const metadata={title:"Admin sign in",robots:{index:false,follow:false}};
export default async function Login({searchParams}:{searchParams:Promise<{result?:string}>}) {
 if(await isAdmin())redirect("/admin");
 const {result}=await searchParams;
 const configured=!!process.env.NEXT_PUBLIC_SUPABASE_URL&&!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 return <main className="narrow"><div className="page-title"><h1>Admin sign in</h1></div>
 {!configured?<p>Supabase authentication has not been configured yet.</p>:<>
 {result==="sent"&&<p role="status" className="admin-notice">If the address belongs to an existing account, a sign-in link has been requested. Check your email.</p>}
 {result==="error"&&<p role="alert" className="form-error">Could not sign in. Try again or request a fresh link.</p>}
 <form className="review-form" method="post" action="/auth/login"><label className="field">Email<input name="email" type="email" required maxLength={254} autoComplete="email"/></label><button>Send sign-in link</button></form>
 <p className="small muted">Use your existing Supabase admin account. New public accounts are not created by this form.</p></>}
 </main>;
}
