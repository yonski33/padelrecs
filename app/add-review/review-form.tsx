"use client";
import {Fragment, useRef, useState} from "react";
import RacketField, {type FieldRacket} from "./racket-field";
import {LogoIcon} from "../icons";
import {MAX_TAGS, TAGS} from "../../lib/tags";
import { niche, catalogPath, hasYears } from "../../lib/niche";

// The API (app/api/reviews/route.ts) accepts exactly these niche option values.
const {words: w, scoreUnit, profile, ratingWords, form: {prompts, tips}} = niche;
const categories = niche.categories.map(c => [c.label, c.column, c.hint] as const);
type Option = {value: string; hint?: string};

// "Time with …" shows only its hint ("A few sessions"); other options show the value with the hint underneath.
function Options({name, options}: {name: string; options: readonly Option[]}) {
 return <div className="opts">{options.map(({value, hint = ""}) =>
  <label key={value}><input type="radio" name={name} value={value}/><span>{name === "timeWithRacket" ? hint : value}{name !== "timeWithRacket" && hint && <small>{hint}</small>}</span></label>)}</div>;
}

export default function ReviewForm({rackets,brands,initialRacket}:{rackets:FieldRacket[],brands:{name:string}[],initialRacket?:string}) {
 const [text,setText]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[rating,setRating]=useState("");
 const [tags,setTags]=useState<string[]>([]);
 const [done,setDone]=useState<null|{alias:string,racket:string,slug?:string}>(null);
 const textarea=useRef<HTMLTextAreaElement>(null);

 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");
  const values=Object.fromEntries(new FormData(event.currentTarget)) as Record<string,string>;
  if(values.racketMode==="existing"&&!values.racketId){setError(`Pick a ${w.one} from the list as you type.`);return;}
  if(values.racketMode==="new"&&!(values.brandName?.trim()&&values.modelName?.trim()&&(!hasYears||/^\d{4}$/.test(values.year||"")))){setError(values.brandName===undefined?`Which ${w.one}? Start typing its name and pick it from the list.`:`For a new ${w.one} we need the brand${hasYears?", model and year":" and product name"}.`);return;}
  if(!values.rating){setError(`Give it an overall rating — tap one of the ${scoreUnit.many}.`);return;}
  if((values.reviewText||"").trim().length<20){setError(`Tell us a little more — at least 20 characters about ${niche.copy.ui.howItWent}.`);return;}
  setBusy(true);
  try {
   const response=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,tags})});
   const result=await response.json() as {error?:string};
   if(!response.ok)throw new Error(result.error||"Could not save your review.");
   const picked=rackets.find(r=>r.id===values.racketId);
   setDone({alias:values.alias?.trim()||"",racket:picked?.name||[values.brandName,values.modelName,values.year].filter(Boolean).join(" "),slug:picked?.slug});
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
  <LogoIcon/>
  <h1>Nice one{done.alias?`, ${done.alias}`:""}.</h1>
  <p>Your review of the {done.racket||w.one} is in the queue. It goes live after a quick check, and the next person deciding will thank you.</p>
  <div className="row">{done.slug&&<a className="button" href={`${catalogPath}/${done.slug}`}>See the {done.racket} page</a>}<a className="button ghost" href="/add-review">{`Review another ${w.one}`}</a></div>
 </div>;

 return <div className="review-page">
  <div>
   <div className="form-title"><h1>Add a review</h1><p>{niche.copy.ui.formIntro}</p></div>
   <form className="review-form" onSubmit={submit} noValidate>
    <section className="step">
     <h2 className="step-h"><span className="no">1</span>{`Which ${w.one}?`}</h2>
     <RacketField rackets={rackets} brands={brands} initialRacket={initialRacket}/>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">2</span>How did it go?</h2>
     <div className="group" role="radiogroup" aria-labelledby="rating-label">
      <span className="group-label" id="rating-label">Overall rating</span>
      <div className="ballpick-row">
       <div className="ballpick">{["5","4","3","2","1"].map(n=><Fragment key={n}><input type="radio" name="rating" value={n} id={`rating-${n}`} checked={rating===n} onChange={()=>setRating(n)}/><label htmlFor={`rating-${n}`} title={ratingWords[n]}><span className="sr-only">{ratingWords[n]}</span></label></Fragment>)}</div>
       <span className="ball-word" aria-hidden="true">{rating?ratingWords[rating]:`Tap a ${scoreUnit.one}`}</span>
      </div>
      <p className="help">Rate how it worked for <em>you</em>, not how good it is on paper.</p>
     </div>
     <div className="group" role="radiogroup" aria-labelledby="time-label">
      <span className="group-label" id="time-label">{`${profile.timeWithRacket.label} `}<span className="opt">optional</span></span>
      <Options name="timeWithRacket" options={profile.timeWithRacket.options}/>
     </div>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">3</span>{`${niche.copy.ui.aboutYou} `}<small>{`optional · helps people find ${niche.people.many} like them`}</small></h2>
     <div className="group" role="radiogroup" aria-labelledby="level-label"><span className="group-label" id="level-label">{profile.playerLevel.label}</span><Options name="playerLevel" options={profile.playerLevel.options}/></div>
     <div className="group" role="radiogroup" aria-labelledby="side-label"><span className="group-label" id="side-label">{profile.playingSide.label}</span><Options name="playingSide" options={profile.playingSide.options}/></div>
     <div className="group" role="radiogroup" aria-labelledby="style-label"><span className="group-label" id="style-label">{profile.playingStyle.label}</span><Options name="playingStyle" options={profile.playingStyle.options}/></div>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">4</span>{`${niche.copy.ui.howItPerforms} `}<small>optional · skip anything you’re unsure about</small></h2>
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
     <div className="group" style={{marginTop:20}}>
      <span className="group-label" id="tags-label">Quick tags <span className="opt">optional · pick up to {MAX_TAGS}</span></span>
      <div className="chip-picker" role="group" aria-labelledby="tags-label">{TAGS.map(t=>{const on=tags.includes(t.label),full=!on&&tags.length>=MAX_TAGS;
       return <button type="button" key={t.label} className={t.tone} aria-pressed={on} disabled={full} onClick={()=>setTags(prev=>prev.includes(t.label)?prev.filter(x=>x!==t.label):prev.length>=MAX_TAGS?prev:[...prev,t.label])}>{t.label}</button>;})}</div>
      <p className="help">{tags.length>=MAX_TAGS?"That’s three — untick one to swap.":"Tags help others skim. Pick what you’d say first about it."}</p>
     </div>
    </section>

    <section className="step">
     <h2 className="step-h"><span className="no">6</span>Sign it</h2>
     <div className="form-grid">
      <label className="field">Alias <span className="opt">optional</span><input name="alias" maxLength={50} autoComplete="nickname"/><small>Any name you like. Leave it blank and you’ll be “anonymous”. Very mysterious.</small></label>
      <label className="field">Email <span className="opt">optional, private</span><input type="email" name="email" maxLength={254} autoComplete="email"/><small>Never shown publicly.</small></label>
     </div>
     {error&&<div className="form-error" role="alert">{error}</div>}
     <div className="submit-row">
      <button disabled={busy} type="submit">{busy?"Posting…":"Post my review"}</button>
      <p>Goes live after a quick spam check.</p>
     </div>
    </section>
   </form>
  </div>
  <aside className="tips">
   <h2>What makes a review useful</h2>
   <ul>
    {tips.map(tip=><li key={tip}>{tip}</li>)}
   </ul>
   <p>Negative reviews are just as welcome. We check for spam, not for opinions.</p>
  </aside>
 </div>;
}
