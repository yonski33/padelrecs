import type { rackets } from "../../db/schema";
import SlugField from "./slug-field";
import ProductPicker from "./product-picker";
import { amazonPhoto } from "../../lib/amazon-photos";
import { photoHidden, shopPhoto } from "../../lib/shop-photos";
import { niche, catalogPath, productHref, hasYears } from "../../lib/niche";
import { MAX_TRAIT_TEXT_HINT, type Trait, type TraitScore } from "../../lib/trait-score";
import { traitDefsFor } from "../../lib/fit-config";
import type { TraitOverride } from "../../db/trait-override";
const w = niche.words;
// This site's trait rows (lib/fit-config.ts).
const DEFS = traitDefsFor(niche), TRAITS = DEFS.map(d => d.key);
const TRAIT_LABEL: Record<string, string> = Object.fromEntries(DEFS.map(d => [d.key, d.label]));
const TRAIT_TAGS: Record<string, { plus: [string, number][]; minus: [string, number][] }> = Object.fromEntries(DEFS.map(d => [d.key, d]));

type Racket = typeof rackets.$inferSelect;
export default function RacketSpecs({models,brands,racketId,oldSlugs=[],traits}:{models:Racket[],brands:{id:string,name:string}[],racketId?:string,oldSlugs?:string[],traits?:{auto:Record<Trait,TraitScore|null>|null,tagged:number,tags:Record<string,number>,edits:TraitOverride|null}}) {
 const selected=models.find(r=>r.id===racketId);
 const photo=selected?(shopPhoto(selected)||amazonPhoto(selected)?.image):null;
 return <div className="narrow">
  <h2 className="admin-heading">{`Edit ${w.one} details`}</h2>
  <ProductPicker tab="specs" models={models} selectedId={selected?.id}/>
  {racketId && !selected && <p role="alert" className="form-error">{`${w.One} not found. Choose a ${w.one} from the list.`}</p>}
  {selected && <form action="/api/funtimes/racket-photo" method="post" encType="multipart/form-data" className="review-form admin-photo" key={`photo-${selected.id}`}>
   <input type="hidden" name="id" value={selected.id}/>
   {photo ? <img src={photo} alt=""/> : <p className="small muted">{photoHidden(selected)?"Showing the drawing.":"No photo yet."}</p>}
   <label className="field">{`${w.One} photo`}<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"/><small>JPG, PNG or WebP under 4 MB. It replaces the current photo everywhere on the site.</small></label>
   <div className="admin-actions">
    <button type="submit" name="action" value="upload">Upload photo</button>
    {!photoHidden(selected)&&photo&&<button type="submit" name="action" value="remove">Remove photo</button>}
    {selected.imageUrl&&<button type="submit" name="action" value="default">Use default photo</button>}
   </div>
  </form>}
  {selected ? <form action="/api/funtimes/racket-specs" method="post" className="review-form" key={selected.id}>
   <input type="hidden" name="id" value={selected.id}/>
   <p className="small"><a href={productHref(selected)} target="_blank" rel="noopener noreferrer">{`View ${w.one} page ↗`}</a></p>
   <p className="small muted">{`Name, brand, year and specifications are shared by all reviews of this ${w.one}.`}</p>
   <label className="field">{`${w.One} name`}<input name="name" required maxLength={260} defaultValue={selected.name}/></label>
   <SlugField initial={selected.slug} oldSlugs={oldSlugs} shape={selected.shape}/>
   <div className="form-grid">
    <label className="field">Brand<select name="brandId" required defaultValue={selected.brandId}>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    {hasYears ? <label className="field">Year<input name="year" type="number" required min={1980} max={2100} defaultValue={selected.year}/></label> : <input type="hidden" name="year" value={selected.year}/>}
    {niche.specs.map(spec=><label className="field" key={spec.column}>{spec.label}<input name={spec.column} list={spec.options?`${spec.column}-options`:undefined} maxLength={spec.max} defaultValue={selected[spec.column]||""} placeholder={spec.placeholder}/>{spec.options&&<datalist id={`${spec.column}-options`}>{spec.options.map(s=><option key={s} value={s}/>)}</datalist>}</label>)}
   </div>
   <label className="field">Signal score <span className="muted">(optional, 1–99)</span><input name="signalOverride" type="number" min={1} max={99} defaultValue={selected.signalOverride ?? ""} placeholder="Worked out from reviews"/><small>Leave blank to use the score worked out from reviews. A number here is shown everywhere and decides this product's place in the rankings.</small></label>
   {/* How it plays by hand (owner 2026-11-15): per trait, auto or 1–5 dots and an optional line; the calculated value and the
       tag counts behind it sit beside each, and every change is recorded (db/trait-override.ts). */}
   {traits&&<fieldset className="field"><legend>How it plays <span className="muted">(dots and line under each trait)</span></legend>
    <p className="small muted">{`Auto = worked out from ${traits.tagged} tagged player reports, against the rest of the catalog. A number here replaces the dots, even when the data is thin.`}</p>
    {TRAITS.map(t=>{const a=traits.auto?.[t]??null,e=traits.edits?.traits[t];
     const counts=[...TRAIT_TAGS[t].plus.map(([tag])=>`+ ${tag} ${traits.tags[tag]??0}`),...TRAIT_TAGS[t].minus.map(([tag])=>`− ${tag} ${traits.tags[tag]??0}`)].join(" · ");
     return <div key={t} className="form-grid">
      <label className="field">{TRAIT_LABEL[t]}<select name={`trait_${t}`} defaultValue={e?.dots?String(e.dots):""}><option value="">auto</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{`${n} ${"●".repeat(n)}${"○".repeat(5-n)}`}</option>)}</select>
       <small>{a?`auto: ${"●".repeat(a.dots)}${"○".repeat(5-a.dots)} (score ${a.score})`:"auto: no dots (too few reports)"} · {counts}</small></label>
      <label className="field">Line under it <span className="muted">(optional)</span><input name={`traittext_${t}`} maxLength={MAX_TRAIT_TEXT_HINT} defaultValue={e?.text??""} placeholder="Blank = the automatic line"/></label>
     </div>;})}
    {(traits.edits?.log.length??0)>0&&<details><summary className="small">{`Changes (${traits.edits!.log.length})`}</summary><ul className="small">{[...traits.edits!.log].reverse().slice(0,20).map((l,i)=><li key={i}>{`${l.at.slice(0,16).replace("T"," ")} · ${l.by} · ${TRAIT_LABEL[l.trait]} ${l.field}: ${l.from??"auto"} → ${l.to??"auto"}`}</li>)}</ul></details>}
   </fieldset>}
   <label className="field">Description<textarea name="description" maxLength={5000} defaultValue={selected.description||""}/></label>
   <p className="small muted">{`Blank optional fields display as “Not specified.” Saving updates the public ${w.one} page within a minute. Linked reviews stay attached; if you change the page address, the old one keeps working.`}</p>
   <button type="submit">{`Save ${w.one} details`}</button>
  </form> : !racketId && <p className="muted">{`Choose a ${w.one} to edit its specifications.`}</p>}
 </div>;
}
