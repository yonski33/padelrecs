import { niche } from "../../lib/niche";
const w = niche.words;
/** The admin's product picker ("Choose a product…" + "Open product"): a plain GET form back to /funtimes on one tab, used by
 *  "Edit product details" (tab=specs) and the Traits tab. No JavaScript needed. */
export default function ProductPicker({ tab, models, selectedId }: { tab: string; models: { id: string; name: string }[]; selectedId?: string }) {
 return <form action="/funtimes" method="get" className="spec-selector">
  <input type="hidden" name="tab" value={tab}/>
  <label className="field">{`Select a ${w.one}`}<select name="racket" required defaultValue={models.some(r => r.id === selectedId) ? selectedId : ""}><option value="" disabled>{`Choose a ${w.one}…`}</option>{models.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
  <button type="submit">{`Open ${w.one}`}</button>
 </form>;
}
