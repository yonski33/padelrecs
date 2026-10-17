"use client";
import { useState } from "react";

export default function RacketPicker({models,brands,searchable=false,initialRacket}:{models:{id:string,name:string}[],brands:{name:string}[],searchable?:boolean,initialRacket?:string}) {
 const [mode,setMode]=useState("existing");
 const [name,setName]=useState(models.find(r=>r.id===initialRacket)?.name||"");
 const selected=models.find(r=>r.name.toLowerCase()===name.trim().toLowerCase());
 const typed=name.trim().replace(/\s+/g," ");
 const typedBrand=[...brands].sort((a,b)=>b.name.length-a.name.length).find(b=>typed.toLowerCase().startsWith(b.name.toLowerCase()+" "));
 const typedYear=typed.match(/(?:^|\s)(\d{4})$/)?.[1]||"";
 const typedModel=typed.slice(typedBrand?typedBrand.name.length+1:0).replace(/\s+\d{4}$/,"");
 return <fieldset className="racket-picker">
  <legend>Racket</legend>
  <div className="racket-mode">
   <label><input type="radio" name="racketMode" value="existing" checked={mode==="existing"} onChange={()=>setMode("existing")}/> Existing racket</label>
   <label><input type="radio" name="racketMode" value="new" checked={mode==="new"} onChange={()=>setMode("new")}/> New racket</label>
  </div>
  {mode==="existing" ? <label className="field">Choose a racket{searchable ? <>
   <input name="racketName" list="racket-options" value={name} onChange={e=>setName(e.target.value)} placeholder="Start typing a racket name…" required autoComplete="off"/>
   <datalist id="racket-options">{models.map(r=><option key={r.id} value={r.name}/>)}</datalist>
   <input type="hidden" name="racketId" value={selected?.id||""}/>
  </> : <select name="racketId" required defaultValue={initialRacket||""}><option value="" disabled>Choose a racket…</option>{models.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>}<small>Not listed? Select “New racket” above to add it.</small></label> : <div className="new-racket-fields">
   <label className="field">Brand<input name="brandName" defaultValue={typedBrand?.name||""} list="brand-options" required maxLength={100} placeholder="e.g. Nox"/><datalist id="brand-options">{brands.map(b=><option key={b.name} value={b.name}/>)}</datalist><small>Choose an existing brand or type a new one.</small></label>
   <div className="form-grid"><label className="field">Model name<input name="modelName" defaultValue={typedModel} required maxLength={150} placeholder="e.g. AT10 Genius 18K"/><small>Without the brand or year.</small></label><label className="field">Year<input name="year" defaultValue={typedYear} type="number" required min={1980} max={2100} placeholder="e.g. 2026"/></label></div>
   <p className="small muted">{searchable ? "Enter the brand, model and year. Your review will be held for moderation." : "The racket will be added to the catalog when you publish this review. Other specifications can remain blank."}</p>
  </div>}
 </fieldset>;
}
