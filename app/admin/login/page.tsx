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
 {result==="password-error"&&<p role="alert" className="form-error">Email or password was not accepted.</p>}
 {result==="password-rate-limited"&&<p role="alert" className="form-error">Too many sign-in attempts. Please wait before trying again.</p>}
 {result==="email-rate-limited"&&<p role="alert" className="form-error">Sign-in emails are temporarily rate-limited. Use your password below or request a link later.</p>}
 <form className="review-form" method="post" action="/auth/login">
 <input type="hidden" name="method" value="password"/>
 <label className="field">Email<input name="email" type="email" required maxLength={254} autoComplete="username"/></label>
 <label className="field">Password<input name="password" type="password" required maxLength={4096} autoComplete="current-password"/></label>
 <button>Sign in</button></form>
 <p className="small muted">Use the email and password for your PadelRecs admin account.</p>
 <details><summary>Email a sign-in link instead</summary><form className="review-form" method="post" action="/auth/login"><input type="hidden" name="method" value="email"/><label className="field">Email<input name="email" type="email" required maxLength={254} autoComplete="email"/></label><button>Send sign-in link</button></form></details></>}
 </main>;
}
