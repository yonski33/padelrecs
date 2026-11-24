import { Fragment } from "react";
/** A product name that never breaks at its own hyphen (Grok audit 2026-11-18: "Hurache- / X Power 2" on a phone): each
 *  hyphenated word stays whole, the name still wraps between words. */
export function NoBreak({ name }: { name: string }) {
  if (!name.includes("-")) return <>{name}</>;
  return <>{name.split(/(\s+)/).map((w, i) => /\S-\S/.test(w) ? <span key={i} style={{ whiteSpace: "nowrap" }}>{w}</span> : <Fragment key={i}>{w}</Fragment>)}</>;
}
