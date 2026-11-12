import {sql,type SQL} from "drizzle-orm";
import {z} from "zod";
import targets from "../deployment/targets.json";
import {niches,productPathIn,type Niche} from "../lib/niche";
import {assertSchemaName} from "./migrations";
import {checkSentiment,DOUBT_SQL,PRAISE_SQL,type SentimentCheck} from "../lib/sentiment-check";

/**
 * The admin's review finder: published web reviews across every niche, which all live in one database, one schema each
 * (deployment/targets.json nicheSchemas). Only schemas recorded there are ever named in a query.
 */
type Db={execute:(query:SQL)=>Promise<unknown>};
const rowsOf=<T>(result:unknown)=>(Array.isArray(result)?result:(result as {rows:T[]}).rows) as T[];

export type SiteRef={id:string;schema:string;name:string;origin:string};
export function reviewSites(recorded:Record<string,string>=targets.nicheSchemas):SiteRef[]{
 return Object.entries(recorded).filter(([id])=>Object.hasOwn(niches,id)&&niches[id].schema===recorded[id])
  .map(([id,schema])=>({id,schema:assertSchemaName(schema),name:niches[id].site.name,origin:`https://www.${niches[id].site.domain}`}))
  .sort((a,b)=>a.name.localeCompare(b.name));
}

const SENTIMENTS=["positive","mixed","negative"] as const;
export const searchInput=z.object({
 q:z.string().trim().max(300).catch(""),
 site:z.string().max(40).catch(""),
 sentiment:z.enum(["",...SENTIMENTS,"none"]).catch(""),
 source:z.string().max(60).catch(""),
 days:z.enum(["","1","7","30","90"]).catch(""),
 check:z.enum(["","doubt"]).catch(""),
 page:z.coerce.number().int().min(1).max(1000).catch(1),
});
export type SearchInput=z.infer<typeof searchInput>;

export type FoundReview={site:string;id:string;racketId:string;product:string;slug:string;shape:string|null;summary:string|null;excerpt:string|null;
 sentiment:(typeof SENTIMENTS)[number]|null;sourcePlatform:string;sourceName:string;sourceUrl:string;sourceDate:string|null;tags:string[];createdAt:string;adminEditedAt:string|null};
export type SearchResult={rows:(FoundReview&{check:SentimentCheck})[];more:boolean};
export const PAGE_SIZE=40;
/** How many doubtful candidates SQL hands over for ranking; the list shows the most doubtful first. */
const DOUBT_POOL=2500;

const like=(text:string)=>`%${text.replace(/[\\%_]/g,m=>`\\${m}`)}%`;
/** Text the search matches against, per word: every word must appear in the product, source name, summary or excerpt. */
function textFilter(q:string):SQL[]{
 if(!q)return [];
 // A pasted link finds that review (with or without www., old. or a query string); a review id is matched as a word.
 if(/^https?:\/\//i.test(q)){const u=q.replace(/^https?:\/\/(www\.|old\.|new\.)?/i,"").replace(/[?#].*$/,"").replace(/\/+$/,"");return [sql`e.source_url ilike ${like(u)}`];}
 return q.split(/\s+/).filter(Boolean).slice(0,8).map(w=>sql`(e.id = ${w} or r.name ilike ${like(w)} or e.source_name ilike ${like(w)} or e.summary ilike ${like(w)} or e.excerpt ilike ${like(w)} or e.source_url ilike ${like(w)})`);
}

export async function searchReviews(db:Db,input:SearchInput,sites=reviewSites(),now=new Date()):Promise<SearchResult>{
 const chosen=input.site?sites.filter(s=>s.id===input.site):sites;
 if(!chosen.length)return {rows:[],more:false};
 const where:SQL[]=textFilter(input.q);
 if(input.sentiment==="none")where.push(sql`e.sentiment is null`);
 else if(input.sentiment)where.push(sql`e.sentiment = ${input.sentiment}`);
 if(input.source)where.push(sql`e.source_platform = ${input.source}`);
 if(input.days)where.push(sql`e.created_at >= ${new Date(now.getTime()-Number(input.days)*86400000).toISOString()}`);
 if(input.check==="doubt"){
  // Positive with a complaint word, or negative with praise; ones the owner already checked are done.
  where.push(sql`e.admin_edited_at is null`);
  where.push(sql`((e.sentiment = 'positive' and coalesce(e.summary,e.excerpt) ~* ${DOUBT_SQL}) or (e.sentiment = 'negative' and coalesce(e.summary,e.excerpt) ~* ${PRAISE_SQL}))`);
 }
 const filter=where.length?sql`where ${sql.join(where,sql` and `)}`:sql``;
 const parts=chosen.map(s=>sql`(select ${s.id}::text as site, e.id, e.racket_id as "racketId", r.name as product, r.slug, r.shape, e.summary, e.excerpt, e.sentiment,
  e.source_platform as "sourcePlatform", e.source_name as "sourceName", e.source_url as "sourceUrl", e.source_date as "sourceDate", e.tags, e.created_at as "createdAt", e.admin_edited_at as "adminEditedAt"
  from ${sql.identifier(s.schema)}.external_reviews e join ${sql.identifier(s.schema)}.rackets r on r.id = e.racket_id ${filter}
  order by e.created_at desc limit ${input.check==="doubt"?DOUBT_POOL:input.page*PAGE_SIZE+1})`);
 const union=sql.join(parts,sql` union all `);
 if(input.check==="doubt"){
  const pool=rowsOf<FoundReview>(await db.execute(sql`select * from (${union}) found order by "createdAt" desc limit ${DOUBT_POOL}`));
  const ranked=pool.map(r=>({...r,check:checkSentiment(r.sentiment,r.summary??r.excerpt??"")})).filter(r=>r.check.score>0)
   .sort((a,b)=>b.check.score-a.check.score||b.createdAt.localeCompare(a.createdAt));
  const start=(input.page-1)*PAGE_SIZE;
  return {rows:ranked.slice(start,start+PAGE_SIZE),more:ranked.length>start+PAGE_SIZE};
 }
 const found=rowsOf<FoundReview>(await db.execute(sql`select * from (${union}) found order by "createdAt" desc, id limit ${PAGE_SIZE+1} offset ${(input.page-1)*PAGE_SIZE}`));
 return {rows:found.slice(0,PAGE_SIZE).map(r=>({...r,check:checkSentiment(r.sentiment,r.summary??r.excerpt??"")})),more:found.length>PAGE_SIZE};
}

export const sentimentInput=z.object({site:z.string().min(1).max(40),id:z.string().min(1).max(100),sentiment:z.enum([...SENTIMENTS,"none"])});
/** One-click label change from the finder. It also marks the review as edited, so publishing keeps it and the doubt list drops it. */
export async function setSentiment(db:Db,value:z.infer<typeof sentimentInput>,sites=reviewSites(),now=new Date()){
 const site=sites.find(s=>s.id===value.site);
 if(!site)return "invalid" as const;
 const updated=rowsOf<{id:string}>(await db.execute(sql`update ${sql.identifier(site.schema)}.external_reviews set sentiment = ${value.sentiment==="none"?null:value.sentiment}, admin_edited_at = ${now.toISOString()} where id = ${value.id} returning id`));
 return updated.length?"saved" as const:"missing" as const;
}

/** Where a found review lives: its product page and its full editor, on its own site. */
export function reviewLinks(site:SiteRef,row:Pick<FoundReview,"id"|"slug"|"shape">,here:Pick<Niche,"id">){
 const base=site.id===here.id?"":site.origin;
 return {product:`${site.origin}${productPathIn(niches[site.id],row)}`,edit:`${base}/funtimes/edit-review?type=web&id=${encodeURIComponent(row.id)}`};
}
