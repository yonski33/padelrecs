export const dynamic = "force-dynamic";
import { catalog } from "../db/data";
import { Review, External, Sidebar } from "./components";
export default async function Home() { const data=await catalog();
const items=[...data.reviews.map(r=>({date:r.createdAt,key:r.id,node:<Review review={r} data={data}/>})),...data.external.map(e=>({date:e.createdAt,key:e.id,node:<External entry={e} data={data}/>}))].sort((a,b)=>b.date.localeCompare(a.date));
return <main className="home"><div className="columns"><div>{items.map(i=><div key={i.key}>{i.node}</div>)}<p className="end-note"><a href="/add-review">Add a review →</a></p></div><Sidebar data={data}/></div></main> }
