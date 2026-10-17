import type { Catalog } from "../db/data";
export function Stars({rating}: {rating:number}) { return <span className="stars" aria-label={`${rating} out of 5 stars`}>{"★".repeat(rating)}<span className="empty-stars">{"★".repeat(5-rating)}</span></span> }
export function Review({review:r, data, showRacket=true}: {review:Catalog["reviews"][number],data:Catalog,showRacket?:boolean}) { const racket=data.rackets.find(x=>x.id===r.racketId)!;return <article className="review"><div className="review-top"><Stars rating={r.rating}/></div>{showRacket && <h3><a href={`/rackets/${racket.slug}`}>{racket.name}</a></h3>}<p className="review-text">{r.reviewText}</p><div className="review-meta">{[r.playerLevel,r.playingSide && `${r.playingSide} side`,r.timeWithRacket && `Played ${r.timeWithRacket.toLowerCase()}`].filter(Boolean).join(" · ")}</div><div className="byline"><span>by <b>{r.alias || "Anonymous player"}</b></span><time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"})}</time></div></article> }
export function External({entry:e,data}: {entry:Catalog["external"][number],data:Catalog}) {
 const racket=data.rackets.find(r=>r.id===e.racketId)!;
 return <article className="review">
  <h3><a href={`/rackets/${racket.slug}`}>{racket.name}</a></h3>
  <p className="review-text">{e.excerpt}</p>
  <div className="review-meta">{e.sourcePlatform} · {e.sourceName}</div>
  <div className="byline">
   {e.sourceDate && <time dateTime={e.sourceDate}>{new Date(e.sourceDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"})}</time>}
   {e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">View original source ↗</a> : <span>Original source not yet added</span>}
  </div>
 </article>;
}
export function Sidebar({data}: {data:Catalog}) {
 const mostReviewed = data.rackets.map(racket => ({
  ...racket, count: data.reviews.filter(review => review.racketId === racket.id).length
 })).filter(racket => racket.count > 0).sort((a,b) => b.count-a.count || a.name.localeCompare(b.name)).slice(0,5);
 return <aside className="database-sidebar">
  <section><h2>Browse by brand</h2><ul className="brand-links">{data.brands.map(b=>{
   const count=data.rackets.filter(r=>r.brandId===b.id).length;
   return <li key={b.id}><a href={`/brands/${b.slug}`}>{b.name}</a><span>{count} {count===1?"racket":"rackets"}</span></li>;
  })}</ul><a className="small" href="/rackets">All rackets →</a></section>
  {mostReviewed.length > 0 && <section><h2>Most reviewed</h2><ul className="sidebar-rackets">{mostReviewed.map(racket=><li key={racket.id}><a href={`/rackets/${racket.slug}`}>{racket.name}</a><span>{racket.count} {racket.count===1?"player review":"player reviews"}</span></li>)}</ul></section>}
 </aside>;
}
