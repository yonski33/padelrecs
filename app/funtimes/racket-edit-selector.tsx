"use client";
import {useState} from "react";
import { niche } from "../../lib/niche";
const w = niche.words;

export default function RacketEditSelector({models,racketId}:{models:{id:string,name:string}[],racketId:string}){
 const [selected,setSelected]=useState(racketId);
 return <>
  <label className="field">{w.One}<select name="racketId" required value={selected} onChange={event=>setSelected(event.target.value)}>{models.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
  <p className="small"><a href={`/funtimes?tab=specs&racket=${encodeURIComponent(selected)}`} target="_blank" rel="noopener noreferrer">{`Edit ${w.one} name, year and specs ↗`}</a></p>
  <p className="small muted">{`Opens in a new tab so your review edits stay here. ${w.One} changes apply to all reviews of that ${w.one}.`}</p>
 </>;
}
