import type { rackets } from "../../db/schema";

type Racket = typeof rackets.$inferSelect;
export default function RacketSpecs({models,brands,racketId}:{models:Racket[],brands:{id:string,name:string}[],racketId?:string}) {
 const selected=models.find(r=>r.id===racketId);
 return <div className="narrow">
  <h2 className="admin-heading">Racket specs</h2>
  <form action="/admin" method="get" className="spec-selector">
   <input type="hidden" name="tab" value="specs"/>
   <label className="field">Select a racket<select name="racket" required defaultValue={selected?.id||""}><option value="" disabled>Choose a racket…</option>{models.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
   <button type="submit">Open racket</button>
  </form>
  {racketId && !selected && <p role="alert" className="form-error">Racket not found. Choose a racket from the list.</p>}
  {selected ? <form action="/api/admin/racket-specs" method="post" className="review-form" key={selected.id}>
   <input type="hidden" name="id" value={selected.id}/>
   <p className="small"><a href={`/rackets/${selected.slug}`} target="_blank" rel="noopener noreferrer">View racket page ↗</a></p>
   <label className="field">Racket name<input name="name" required maxLength={260} defaultValue={selected.name}/></label>
   <div className="form-grid">
    <label className="field">Brand<select name="brandId" required defaultValue={selected.brandId}>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <label className="field">Year<input name="year" type="number" required min={1980} max={2100} defaultValue={selected.year}/></label>
    <label className="field">Shape<input name="shape" list="shape-options" maxLength={100} defaultValue={selected.shape||""} placeholder="e.g. Round"/><datalist id="shape-options">{["Round","Teardrop","Diamond","Hybrid"].map(s=><option key={s} value={s}/>)}</datalist></label>
    <label className="field">Weight<input name="weight" maxLength={120} defaultValue={selected.weight||""} placeholder="e.g. 365 g or 355–375 g"/></label>
    <label className="field">Balance<input name="balance" list="balance-options" maxLength={120} defaultValue={selected.balance||""} placeholder="e.g. Medium or 265 mm"/><datalist id="balance-options">{["Low","Medium","High"].map(s=><option key={s} value={s}/>)}</datalist></label>
    <label className="field">Surface<input name="surface" maxLength={200} defaultValue={selected.surface||""} placeholder="e.g. 12K carbon"/></label>
    <label className="field">Core<input name="core" maxLength={200} defaultValue={selected.core||""} placeholder="e.g. Multi-EVA"/></label>
   </div>
   <label className="field">Description<textarea name="description" maxLength={5000} defaultValue={selected.description||""}/></label>
   <p className="small muted">Blank optional fields display as “Not specified.” Saving updates the public racket page immediately. The page URL and linked reviews stay the same.</p>
   <button type="submit">Save specs</button>
  </form> : !racketId && <p className="muted">Choose a racket to edit its specifications.</p>}
 </div>;
}
