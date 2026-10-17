"use client";
import {Fragment, useRef, useState} from "react";
import RacketPicker from "../racket-picker";
import {BallIcon} from "../icons";

// Option values must match the API's accepted values in app/api/reviews/route.ts.
const levels = [["Beginner","< 1 year"],["Intermediate","regular matches"],["Advanced","tournaments"],["Competitive","ranked play"]] as const;
const sides = ["Left","Right","Both"] as const;
const styles = ["Attacking","All-round","Defensive"] as const;
const times = [["Tried briefly","A few sessions"],["Less than 1 month","< 1 month"],["1–6 months","1–6 months"],["6–12 months","6–12 months"],["More than 1 year","1 year +"]] as const;
const categories = [["Power","powerRating","smashes, ball speed"],["Control","controlRating","placement, touch"],["Maneuverability","maneuverabilityRating","speed at the net"],["Comfort","comfortRating","vibration, arm"],["Forgiveness","forgivenessRating","sweet spot, mishits"]] as const;
const ratingWords: Record<string,string> = {"5":"5 — loved it","4":"4 — really liked it","3":"3 — it’s fine","2":"2 — not for me","1":"1 — regret buying it"};
const prompts = [["What did you switch from?","Before this I played with "],["Weight as played?","Mine weighs about "],["Arm comfort?","On my arm it "]] as const;

function Options({name, options}: {name: string; options: readonly (string | readonly [string, string])[]}) {
 return <div className="opts">{options.map(o => { const [value, hint] = typeof o === "string" ? [o, ""] : o;
  return <label key={value}><input type="radio" name={name} value={value}/><span>{name === "timeWithRacket" ? hint : value}{name !== "timeWithRacket" && hint && <small>{hint}</small>}</span></label>; })}</div>;
}

export default function ReviewForm({rackets,brands,initialRacket}:{rackets:{id:string,name:string,slug:string}[],brands:{name:string}[],initialRacket?:string}) {
 const [text,setText]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[rating,setRating]=useState("");
 const [done,setDone]=useState<null|{alias:string,racket:string,slug?:string}>(null);
 const textarea=useRef<HTMLTextAreaElement>(null);

 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");
  const values=Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>;
  if(values.racketMode==="existing"&&!values.racketId){setError("Pick a racket from the list, or choose “New racket” to add one.");return;}
  if(!values.rating){setError("Give it an overall rating — tap one of the balls.");return;}
  if((values.reviewText||"").trim().length<20){setError("Tell us a little more — at least 20 characters about how it played.");return;}
  setBusy(true);
  try {
   const response=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});
   const result=await response.json() as {error?:string};
   if(!response.ok)throw new Error(result.error||"Could not save your review.");
   const picked=rackets.find(r=>r.id===values.racketId);
   setDone({alias:values.alias?.trim()||"",racket:picked?.name||[values.brandName,values.modelName].filter(Boolean).join(" "),slug:picked?.slug});
   window.scrollTo({top:0,behavior:"smooth"});
  }catch(e){setError(e instanceof Error?e.message:"Could not save your review. Please try again.");}
  finally{setBusy(false);}
 }

 function addPrompt(start:string){
  const next=(text.trimEnd()+(text.trim()?" ":"")+start);
  setText(next);
  requestAnimationFrame(()=>{const t=textarea.current;if(t){t.focus();t.setSelectionRange(next.length,next.length);}});
 }

 if(done)return <div className="success" role="status">
  <BallIcon/>
  <h1>Nice one{done.alias?`, ${done.alias}`:""}.</h1>
  <p>Your note on the {done.racket||"racket"} is in the queue. It goes live after a quick check, and the next person deciding will thank you.</p>
  <div className="row">{done.slug&&<a className="button" href={`/rackets/${done.slug}`}>See the {done.racket} page</a>}<a className="button ghost" href="/add-review">Review another racket</a></div>
 </div>;

 return <div className="review-page">
  <div>
   <div className="form-title"><h1>Add a review</h1><p>Tell other players how a racket actually played for you. Takes about two minutes, no account needed.</p></div>
   <form className="review-form" onSubmit={submit} noValidate>
    <section className="step">
     <h2 className="step-h"><span className="no">1</span>Which racket?</h2>
     <RacketPicker models={rackets} brands={brands} initialRacket={initialRacket} searchable/>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">2</span>How did it go?</h2>
     <div className="group" role="radiogroup" aria-labelledby="rating-label">
      <span className="group-label" id="rating-label">Overall rating</span>
      <div className="ballpick-row">
       <div className="ballpick">{["5","4","3","2","1"].map(n=><Fragment key={n}><input type="radio" name="rating" value={n} id={`rating-${n}`} checked={rating===n} onChange={()=>setRating(n)}/><label htmlFor={`rating-${n}`} title={ratingWords[n]}><span className="sr-only">{ratingWords[n]}</span></label></Fragment>)}</div>
       <span className="ball-word" aria-hidden="true">{rating?ratingWords[rating]:"Tap a ball"}</span>
      </div>
      <p className="help">Rate how it worked for <em>you</em>, not how good it is on paper.</p>
     </div>
     <div className="group" role="radiogroup" aria-labelledby="time-label">
      <span className="group-label" id="time-label">Time with racket <span className="opt">optional</span></span>
      <Options name="timeWithRacket" options={times}/>
     </div>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">3</span>About your game <small>optional · helps people find players like them</small></h2>
     <div className="group" role="radiogroup" aria-labelledby="level-label"><span className="group-label" id="level-label">Level</span><Options name="playerLevel" options={levels}/></div>
     <div className="group" role="radiogroup" aria-labelledby="side-label"><span className="group-label" id="side-label">Side</span><Options name="playingSide" options={sides}/></div>
     <div className="group" role="radiogroup" aria-labelledby="style-label"><span className="group-label" id="style-label">Style</span><Options name="playingStyle" options={styles}/></div>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">4</span>How it plays <small>optional · skip anything you’re unsure about</small></h2>
     <div className="scale-ends" aria-hidden="true"><span>← low</span><span>high →</span></div>
     <div className="scale-rows">{categories.map(([label,name,hint])=><div className="scale-row" key={name} role="radiogroup" aria-labelledby={`${name}-label`}>
      <span className="nm" id={`${name}-label`}>{label}<small>{hint}</small></span>
      <div className="pips">
       {[1,2,3,4,5].map(n=><label key={n}><input type="radio" name={name} value={n} aria-label={`${label} ${n} of 5`}/><span>{n}</span></label>)}
       <label className="skip"><input type="radio" name={name} value="" defaultChecked aria-label={`Skip ${label}`}/><span>skip</span></label>
      </div>
     </div>)}</div>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">5</span>In your own words</h2>
     <label className="field" htmlFor="reviewText" style={{marginBottom:0}}>Your experience</label>
     <div className="prompts">Stuck? Try:{prompts.map(([label,start])=><button type="button" key={label} onClick={()=>addPrompt(start)}>{label}</button>)}</div>
     <textarea id="reviewText" name="reviewText" ref={textarea} value={text} onChange={e=>setText(e.target.value)} minLength={20} required placeholder="What did you like? What drove you nuts? What would you tell a friend thinking about buying it?"/>
     <div className="count-row"><span>{text.trim().length<20?`At least 20 characters — ${20-text.trim().length} to go.`:"A few sentences is plenty."}</span><span>{text.length.toLocaleString()} characters</span></div>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">6</span>Sign it</h2>
     <div className="form-grid">
      <label className="field">Alias <span className="opt">optional</span><input name="alias" maxLength={50} autoComplete="nickname"/><small>Any name you like. Leave it blank and you’ll be “anonymous”. Very mysterious.</small></label>
      <label className="field">Email <span className="opt">optional, private</span><input type="email" name="email" maxLength={254} autoComplete="email"/><small>Never shown publicly.</small></label>
     </div>
     {error&&<div className="form-error" role="alert">{error}</div>}
     <div className="submit-row">
      <button disabled={busy} type="submit">{busy?"Posting…":"Post my note"}</button>
      <p>Goes live after a quick spam check.</p>
     </div>
    </section>
   </form>
  </div>
  <aside className="tips">
   <h2>What makes a note useful</h2>
   <ul>
    <li>What you played with before, and how this compares</li>
    <li>Your weight as played, if you know it</li>
    <li>Where it shines and where it struggles</li>
    <li>Arm comfort, if that matters to you</li>
    <li>Durability, once you’ve had it a while</li>
   </ul>
   <p>Negative notes are just as welcome. We check for spam, not for opinions.</p>
  </aside>
 </div>;
}
