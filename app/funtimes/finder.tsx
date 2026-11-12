import type {ReactNode} from "react";
import {niches} from "../../lib/niche";
import {reviewLinks,type SearchInput,type SearchResult,type SiteRef} from "../../db/review-search";
import SentimentButtons from "./sentiment-buttons";

/** The admin search bar, shown on every admin tab; it searches published web reviews on all sites (db/review-search.ts). */
export function FinderForm({input,sites,sources}:{input:SearchInput;sites:SiteRef[];sources:string[]}){
 return <form className="finder-form" method="get" action="/funtimes" role="search">
  <input type="hidden" name="tab" value="find"/>
  {input.check&&<input type="hidden" name="check" value={input.check}/>}
  <div className="finder-bar"><input type="search" name="q" defaultValue={input.q} aria-label="Search reviews" placeholder="Product, source, words, link or review id"/><button type="submit">Search</button></div>
  <div className="finder-filters">
   <select name="site" defaultValue={input.site} aria-label="Site"><option value="">All sites</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
   <select name="sentiment" defaultValue={input.sentiment} aria-label="Sentiment"><option value="">Any sentiment</option><option value="positive">Positive</option><option value="mixed">Mixed</option><option value="negative">Negative</option><option value="none">Not judged</option></select>
   <select name="source" defaultValue={input.source} aria-label="Source"><option value="">Any source</option>{sources.map(s=><option key={s}>{s}</option>)}</select>
   <select name="days" defaultValue={input.days} aria-label="Published"><option value="">Any time</option><option value="1">Published today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
  </div>
 </form>;
}

const query=(input:SearchInput,change:Partial<Record<keyof SearchInput,string|number>>)=>{
 const p=new URLSearchParams({tab:"find"});
 for(const [k,v] of Object.entries({...input,page:1,...change}))if(v!==""&&!(k==="page"&&v===1))p.set(k,String(v));
 return `/funtimes?${p}`;
};
/** The summary with the words behind a "Maybe wrong" flag marked, so the reason is visible at a glance. */
function marked(text:string,words:string[]):ReactNode{
 if(!words.length)return text;
 const re=new RegExp(`\\b(${words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/’/g,"['’]")).join("|")})\\b`,"gi");
 return text.split(re).map((part,i)=>i%2?<mark key={i}>{part}</mark>:part);
}
const day=(iso:string)=>new Date(iso).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});

export function FinderResults({input,result,sites,here}:{input:SearchInput;result:SearchResult;sites:SiteRef[];here:string}){
 const doubt=input.check==="doubt";
 return <section className="finder" aria-label="Found reviews">
  <div className="admin-filters finder-modes">
   <a href={query(input,{check:""})} aria-current={!doubt?"page":undefined}>All reviews</a>
   <a href={query(input,{check:"doubt"})} aria-current={doubt?"page":undefined}>Maybe wrong sentiment</a>
  </div>
  {doubt&&<p className="small muted">Positive reviews whose summary has complaint words (“but”, “returned”, “issue”…), and negative ones that are mostly praise, most doubtful first. Choosing any label, including the current one, takes a review off this list and keeps your choice when the research queue publishes again.</p>}
  {result.rows.length?result.rows.map(r=>{
   const site=sites.find(s=>s.id===r.site)!,links=reviewLinks(site,r,{id:here}),text=r.summary??r.excerpt??"";
   return <article className="found" key={`${r.site}:${r.id}`}>
    <header className="found-head"><span className="found-site">{site.name}</span><a href={links.product} target="_blank" rel="noopener noreferrer">{r.product}</a><time dateTime={r.createdAt}>{day(r.createdAt)}</time></header>
    <p className="found-text">{marked(text,r.check.words)}</p>
    {r.summary&&r.excerpt&&<details className="found-quote"><summary>Source’s words</summary><p>“{r.excerpt}”</p></details>}
    <div className="found-meta"><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{r.sourcePlatform} · {r.sourceName} ↗</a>{r.tags.length>0&&<span>{r.tags.join(", ")}</span>}{r.adminEditedAt&&<span>edited {day(r.adminEditedAt)}</span>}</div>
    <div className="found-actions"><SentimentButtons key={`${r.site}:${r.id}:${r.sentiment}`} site={r.site} id={r.id} current={r.sentiment} suggest={r.check.suggest}/><a className="found-edit" href={links.edit}>{r.site===here?"Edit text or tags":`Edit on ${site.name} ↗`}</a></div>
    <p className="found-id small muted">{r.id}</p>
   </article>;
  }):<p className="admin-empty">{doubt?"Nothing looks doubtful with these filters.":"No reviews match."}</p>}
  <div className="admin-pagination">{input.page>1&&<a href={query(input,{page:input.page-1})}>← Previous</a>}{result.more&&<a href={query(input,{page:input.page+1})}>More →</a>}</div>
 </section>;
}

/** Every source platform used on any site, for the source filter. */
export const allSources=()=>[...new Set(Object.values(niches).flatMap(n=>n.sourcePlatforms))].sort();
