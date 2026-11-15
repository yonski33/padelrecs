import type { rackets } from "../../db/schema";
import { niche, productHref } from "../../lib/niche";
import type { TraitScore } from "../../lib/trait-score";
import { traitDefsFor } from "../../lib/fit-config";
import { EXPERT_KEYS, MAX_EXPERT_NOTE, type ExpertKey, type TraitOverride } from "../../db/trait-override";
import type { EvidenceRow } from "../../lib/evidence";
import type { Suits } from "../../lib/level-suits";
const w = niche.words;

// Expert editing in admin (owner 2026-11-15, ENGINE-PLAN section D): one grid per racket, one row per attribute (the six
// traits and the three level "suits" scores). Each row shows the calculated 0–100, how sure it is, the evidence behind it with
// a link to the rows, and an expert field (0–100, or 1–10 ×10) with a required note. The expert value wins on the site; the
// calculated one stays here. A row is flagged when the two drift more than DRIFT apart.
export const DRIFT = 15;
type Racket = typeof rackets.$inferSelect;
const KEY_LABEL: Record<ExpertKey, string> = { ...Object.fromEntries(traitDefsFor(niche).map(t => [t.key, t.label])),
  suits_beginner: "Suits beginners", suits_intermediate: "Suits intermediates", suits_advanced: "Suits advanced" };

export default function ExpertGrid({ models, racketId, auto, suits, edits, evidence, showEvidence, result }: {
  models: Racket[]; racketId?: string; auto: Record<string, TraitScore | null> | null; suits: Suits | null; edits: TraitOverride | null;
  evidence: EvidenceRow[]; showEvidence?: string; result?: string }) {
  const selected = models.find(r => r.id === racketId);
  const rowsFor = (k: ExpertKey) => evidence.filter(r => k.startsWith("suits_") ? r.attribute === "level" : r.attribute === k);
  const calc = (k: ExpertKey): number | null => k.startsWith("suits_") ? suits?.[k.slice(6) as "beginner" | "intermediate" | "advanced"] ?? null : auto?.[k]?.score ?? null;
  const confidence = (k: ExpertKey) => {
    if (k.startsWith("suits_")) { const b = suits?.basis.filter(x => x !== "expert") ?? []; return b.some(x => x !== "the brand") ? (b.length >= 2 ? "high" : "medium") : b.length ? "low (brand only)" : "none"; }
    const p = auto?.[k]?.people, n = p ? p.players.plus + p.players.minus + p.reviewers.plus + p.reviewers.minus : 0;
    return n >= 8 ? "high" : n >= 2 ? "medium" : n ? "low" : "none";
  };
  const backing = (k: ExpertKey) => {
    if (k.startsWith("suits_")) return suits?.basis.filter(x => x !== "expert").join(", ") || "no level evidence";
    const p = auto?.[k]?.people;
    if (!p) return "no evidence";
    return `${p.players.plus} players + ${p.reviewers.plus} reviewers praise · ${p.players.minus + p.reviewers.minus} fault`;
  };
  const ev = showEvidence && (EXPERT_KEYS as readonly string[]).includes(showEvidence) ? rowsFor(showEvidence as ExpertKey) : null;
  const log = [...(edits?.expertLog ?? [])].reverse();
  return <div>
    <h2 className="admin-heading">Expert values</h2>
    <p className="small muted">{`One row per attribute. The expert value (0–100, or 1–10 which counts ×10) wins on the site; the calculated value stays here. A note is required. Rows where the two differ by more than ${DRIFT} are flagged.`}</p>
    <form action="/funtimes" method="get" className="spec-selector">
      <input type="hidden" name="tab" value="expert"/>
      <label className="field">{`Select a ${w.one}`}<select name="racket" required defaultValue={selected?.id || ""}><option value="" disabled>{`Choose a ${w.one}…`}</option>{models.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <button type="submit">{`Open ${w.one}`}</button>
    </form>
    {result === "expert-saved" && <p role="status" className="admin-notice">Expert values saved.</p>}
    {result?.startsWith("expert-imported") && <p role="status" className="admin-notice">{`Imported: ${result.split(":")[1] ?? "0"} values.`}</p>}
    {result === "expert-failed" && <p role="alert" className="form-error">Could not save. Nothing changed.</p>}
    {selected && <>
      <p className="small"><a href={productHref(selected)} target="_blank" rel="noopener noreferrer">{`${selected.name} on the site ↗`}</a></p>
      <form action="/api/funtimes/expert" method="post" className="review-form">
        <input type="hidden" name="id" value={selected.id}/>
        <table className="expert-grid">
          <thead><tr><th>Attribute</th><th>Calculated</th><th>Confidence</th><th>Evidence</th><th>Expert (0–100 or 1–10)</th><th>Note (required)</th></tr></thead>
          <tbody>{EXPERT_KEYS.map(k => {
            const c = calc(k), e = edits?.expert?.[k], drift = e && c !== null && Math.abs(e.value - c) > DRIFT, n = rowsFor(k).length;
            return <tr key={k} className={drift ? "drift" : undefined}>
              <th scope="row">{KEY_LABEL[k]}</th>
              <td>{c ?? "–"}{drift && <span className="badge">{` ⚠ drift ${Math.abs(e!.value - c!)}`}</span>}</td>
              <td>{confidence(k)}</td>
              <td><span className="small">{backing(k)}</span>{" · "}<a href={`/funtimes?tab=expert&racket=${encodeURIComponent(selected.id)}&evidence=${k}#evidence`}>{`${n} rows`}</a></td>
              <td><input name={`expert_${k}`} inputMode="decimal" defaultValue={e ? String(e.value) : ""} placeholder="blank = calculated" aria-label={`${KEY_LABEL[k]} expert value`} size={8}/></td>
              <td><input name={`note_${k}`} maxLength={MAX_EXPERT_NOTE} defaultValue={e?.note ?? ""} placeholder="why" aria-label={`${KEY_LABEL[k]} note`}/></td>
            </tr>; })}</tbody>
        </table>
        <p className="small muted">Clear a value to go back to the calculated score.</p>
        <button type="submit">Save expert values</button>
      </form>
      {log.length > 0 && <details open><summary className="small">{`Changes (${log.length})`}</summary><table className="expert-grid small">
        <thead><tr><th>When</th><th>Who</th><th>Attribute</th><th>Old</th><th>New</th><th>Note</th></tr></thead>
        <tbody>{log.slice(0, 40).map((l, i) => <tr key={i}><td>{l.at.slice(0, 16).replace("T", " ")}</td><td>{l.by}</td><td>{KEY_LABEL[l.key]}</td><td>{l.from ?? "calculated"}</td><td>{l.to ?? "calculated"}</td><td>{l.note}</td></tr>)}</tbody></table></details>}
      {ev && <section id="evidence"><h3 className="admin-heading">{`Evidence: ${KEY_LABEL[showEvidence as ExpertKey]} (${ev.length})`}</h3>
        <table className="expert-grid small"><thead><tr><th>Source</th><th>Value</th><th>Strength</th><th>Quote</th><th>From</th></tr></thead>
          <tbody>{ev.slice(0, 200).map((r, i) => <tr key={i}><td>{r.sourceKind}</td><td>{r.valueText ?? (r.value === null ? "" : r.value > 0 ? "+1" : String(r.value))}</td><td>{r.strength}</td><td>{r.quote ?? ""}</td><td>{r.extractedBy}</td></tr>)}</tbody></table></section>}
    </>}
    <section>
      <h3 className="admin-heading">Import an expert sheet</h3>
      <p className="small muted">Paste the filled-in CSV (padel-expert-gaps.csv: slug, expert_forgiveness … expert_speed on 1–10 or 0–100, expert_level as beginner / intermediate / advanced or a range like intermediate-advanced, notes). Every value needs the row&apos;s notes, or the note you give here.</p>
      <form action="/api/funtimes/expert" method="post" className="review-form">
        <input type="hidden" name="action" value="import"/>
        <textarea name="csv" rows={6} placeholder="name,slug,reports,evidence_rows,missing,expert_forgiveness,…"/>
        <label className="field">Note for rows without one<input name="note" maxLength={MAX_EXPERT_NOTE} placeholder="e.g. expert sheet, Nov 2026"/></label>
        <button type="submit">Import sheet</button>
      </form>
    </section>
  </div>;
}
