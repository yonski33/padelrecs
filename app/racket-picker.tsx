"use client";
import { useState } from "react";
import { niche, hasYears } from "../lib/niche";
import VariantSelect from "./variant-select";

const { words: w, examples: ex } = niche;

/** variants: each product's variants by id, on niches with niche.variants (DiscGolfRecs plastics), for the optional picker. */
export default function RacketPicker({models,brands,searchable=false,initialRacket,variants}:{models:{id:string,name:string}[],brands:{name:string}[],searchable?:boolean,initialRacket?:string,variants?:Record<string,string[]>}) {
 const [mode,setMode]=useState("existing");
 const [picked,setPicked]=useState(initialRacket||"");
 const [name,setName]=useState(models.find(r=>r.id===initialRacket)?.name||"");
 const selected=models.find(r=>r.name.toLowerCase()===name.trim().toLowerCase());
 const typed=name.trim().replace(/\s+/g," ");
 const typedBrand=[...brands].sort((a,b)=>b.name.length-a.name.length).find(b=>typed.toLowerCase().startsWith(b.name.toLowerCase()+" "));
 const typedYear=hasYears?typed.match(/(?:^|\s)(\d{4})$/)?.[1]||"":"";
 const typedModel=typed.slice(typedBrand?typedBrand.name.length+1:0).replace(hasYears?/\s+\d{4}$/:/$^/,"");
 const racketId=searchable?selected?.id||"":picked;
 return <><fieldset className="racket-picker">
  <legend>{w.One}</legend>
  <div className="racket-mode">
   <label><input type="radio" name="racketMode" value="existing" checked={mode==="existing"} onChange={()=>setMode("existing")}/>{` Existing ${w.one}`}</label>
   <label><input type="radio" name="racketMode" value="new" checked={mode==="new"} onChange={()=>setMode("new")}/>{` New ${w.one}`}</label>
  </div>
  {mode==="existing" ? <label className="field">{`Choose a ${w.one}`}{searchable ? <>
   <input name="racketName" list="racket-options" value={name} onChange={e=>setName(e.target.value)} placeholder={`Start typing a ${w.one} name…`} required autoComplete="off"/>
   <datalist id="racket-options">{models.map(r=><option key={r.id} value={r.name}/>)}</datalist>
   <input type="hidden" name="racketId" value={selected?.id||""}/>
  </> : <select name="racketId" required value={picked} onChange={e=>setPicked(e.target.value)}><option value="" disabled>{`Choose a ${w.one}…`}</option>{models.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>}<small>{`Not listed? Select “New ${w.one}” above to add it.`}</small></label> : <div className="new-racket-fields">
   <label className="field">Brand<input name="brandName" defaultValue={typedBrand?.name||""} list="brand-options" required maxLength={100} placeholder={`e.g. ${ex.brand}`}/><datalist id="brand-options">{brands.map(b=><option key={b.name} value={b.name}/>)}</datalist><small>Choose an existing brand or type a new one.</small></label>
   <div className="form-grid"><label className="field">Model name<input name="modelName" defaultValue={typedModel} required maxLength={150} placeholder={`e.g. ${ex.model}`}/><small>{hasYears ? "Without the brand or year." : "Without the brand."}</small></label>{hasYears && <label className="field">Year<input name="year" defaultValue={typedYear} type="number" required min={1980} max={2100} placeholder={`e.g. ${ex.year}`}/></label>}</div>
   <p className="small muted">{searchable ? `Enter the brand, ${hasYears ? "model and year" : "and product name"}. Your review will be held for moderation.` : `The ${w.one} will be added to the catalog when you publish this review. Other specifications can remain blank.`}</p>
  </div>}
 </fieldset>
 {/* Niches with variants (DiscGolfRecs: the plastic), for an existing product with a list; a new product has none yet. */}
 {mode==="existing"&&racketId&&<VariantSelect key={racketId} options={variants?.[racketId]} className="field"/>}
 </>;
}
