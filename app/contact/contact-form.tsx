"use client";
import {useEffect, useRef, useState} from "react";
import Link from "next/link";
import {LogoIcon} from "../icons";

// A signed "form opened at" token (lib/form-token.ts); refreshed hourly so a form left open for a long time still posts.
async function fetchFormToken(){
 try{const r=await fetch("/api/contact",{cache:"no-store"});return r.ok?((await r.json()) as {token?:string}).token||"":"";}catch{return "";}
}

export default function ContactForm({siteName}:{siteName:string}) {
 const formToken=useRef("");
 useEffect(()=>{
  const load=()=>fetchFormToken().then(t=>{if(t)formToken.current=t;});
  load();const timer=setInterval(load,60*60_000);return ()=>clearInterval(timer);
 },[]);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[done,setDone]=useState<null|{name:string}>(null);

 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");
  const values=Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>;
  if(!values.name?.trim()){setError("Tell us your name.");return;}
  if(!/^\S+@\S+\.\S+$/.test(values.email?.trim()||"")){setError("Add an email address so we can reply.");return;}
  if(!values.subject?.trim()){setError("Add a subject.");return;}
  if((values.message||"").trim().length<10){setError("Your message needs at least 10 characters.");return;}
  if(!formToken.current)formToken.current=await fetchFormToken();
  if(!formToken.current){setError("Could not reach the site. Check your connection and try again.");return;}
  setBusy(true);
  try {
   const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,formToken:formToken.current})});
   const result=await response.json() as {error?:string};
   if(!response.ok)throw new Error(result.error||"Could not send your message.");
   setDone({name:values.name.trim()});
   window.scrollTo({top:0,behavior:"smooth"});
  }catch(e){setError(e instanceof Error?e.message:"Could not send your message. Please try again.");}
  finally{setBusy(false);}
 }

 if(done)return <div className="success" role="status">
  <LogoIcon/>
  <h1>Thanks, {done.name}.</h1>
  <p>Your message reached the {siteName} team. We read everything and reply by email, usually within a few days.</p>
  <div className="row"><Link className="button" href="/">Back to the home page</Link></div>
 </div>;

 return <div className="contact-page">
  <div className="form-title"><h1>Contact us</h1><p>Questions, corrections, a product we’re missing, or a partnership idea? Send it here and we’ll reply by email.</p></div>
  <form className="review-form contact-form" onSubmit={submit} noValidate>
   {/* Honeypot: off-screen and skipped by keyboard and screen readers; a filled one marks the post as a bot's. */}
   <div className="hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue=""/></label></div>
   <div className="form-grid">
    <label className="field">Name<input name="name" maxLength={100} autoComplete="name" required/></label>
    <label className="field">Email<input type="email" name="email" maxLength={254} autoComplete="email" required/><small>Only used to reply to you.</small></label>
   </div>
   <label className="field">Subject<input name="subject" maxLength={150} required/></label>
   <label className="field">Message<textarea name="message" minLength={10} maxLength={5000} required/></label>
   {error&&<div className="form-error" role="alert">{error}</div>}
   <div className="submit-row">
    <button disabled={busy} type="submit">{busy?"Sending…":"Send message"}</button>
   </div>
  </form>
 </div>;
}
