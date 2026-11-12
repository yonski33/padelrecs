"use client";
import {useState} from "react";

type Label="positive"|"mixed"|"negative";
const LABELS:Label[]=["positive","mixed","negative"];
/** Positive / Mixed / Negative in one click. Clicking the current label confirms it, which also takes the review off the
 *  "Maybe wrong" list. Saves through /api/funtimes/sentiment without reloading the page. */
export default function SentimentButtons({site,id,current,suggest}:{site:string;id:string;current:Label|null;suggest?:Label|null}){
 const [value,setValue]=useState(current),[state,setState]=useState<"idle"|"saving"|"saved"|"error">("idle");
 async function choose(next:Label){
  setState("saving");
  try{
   const res=await fetch("/api/funtimes/sentiment",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({site,id,sentiment:next})});
   if(!res.ok)throw new Error();
   setValue(next);setState("saved");
  }catch{setState("error");}
 }
 return <div className="sent-buttons" role="group" aria-label="Sentiment">
  {LABELS.map(l=><button key={l} type="button" disabled={state==="saving"} aria-pressed={value===l} className={`s-${l}${suggest===l&&value!==l?" suggested":""}`} onClick={()=>choose(l)}>{l[0].toUpperCase()+l.slice(1)}</button>)}
  <span className="sent-state" aria-live="polite">{state==="saved"?"Saved ✓":state==="error"?"Not saved, try again":state==="saving"?"Saving…":""}</span>
 </div>;
}
