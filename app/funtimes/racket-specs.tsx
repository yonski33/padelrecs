import type { rackets } from "../../db/schema";
import SlugField from "./slug-field";
import { niche, catalogPath, productHref, hasYears } from "../../lib/niche";
const w = niche.words;

type Racket = typeof rackets.$inferSelect;
export default function RacketSpecs({models,brands,racketId,oldSlugs=[]}:{models:Racket[],brands:{id:string,name:string}[],racketId?:string,oldSlugs?:string[]}) {
 const selected=models.find(r=>r.id===racketId);
 return <div className="narrow">
  <h2 className="admin-heading">{`Edit ${w.one} details`}</h2>
  <form action="/funtimes" method="get" className="spec-selector">
   <input type="hidden" name="tab" value="specs"/>
   <label className="field">{`Select a ${w.one}`}<select name="racket" required defaultValue={selected?.id||""}><option value="" disabled>{`Choose a ${w.one}…`}</option>{models.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
   <button type="submit">{`Open ${w.one}`}</button>
  </form>
  {racketId && !selected && <p role="alert" className="form-error">{`${w.One} not found. Choose a ${w.one} from the list.`}</p>}
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
   <label className="field">Description<textarea name="description" maxLength={5000} defaultValue={selected.description||""}/></label>
   <p className="small muted">{`Blank optional fields display as “Not specified.” Saving updates the public ${w.one} page within a minute. Linked reviews stay attached; if you change the page address, the old one keeps working.`}</p>
   <button type="submit">{`Save ${w.one} details`}</button>
  </form> : !racketId && <p className="muted">{`Choose a ${w.one} to edit its specifications.`}</p>}
 </div>;
}
