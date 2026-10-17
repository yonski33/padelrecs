"use client";
import {useState} from "react";

export default function RacketEditSelector({models,racketId}:{models:{id:string,name:string}[],racketId:string}){
 const [selected,setSelected]=useState(racketId);
 return <>
  <label className="field">Racket<select name="racketId" required value={selected} onChange={event=>setSelected(event.target.value)}>{models.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
  <p className="small"><a href={`/admin?tab=specs&racket=${encodeURIComponent(selected)}`} target="_blank" rel="noopener noreferrer">Edit racket name, year and specs ↗</a></p>
  <p className="small muted">Opens in a new tab so your review edits stay here. Racket changes apply to all reviews of that racket.</p>
 </>;
}
