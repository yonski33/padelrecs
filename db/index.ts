import "server-only";
import { assertDatabaseTarget } from "../lib/deployment-target";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
// One pool per process: Next can load this module once per bundle layer (pages, route handlers), so it lives on globalThis.
const shared = globalThis as typeof globalThis & { recsDbPool?: Pool };
export const IDLE_SECONDS = 5;
/** While `next build` prerenders (NEXT_PHASE), ~30 sites build at once against one Supabase pooler (limit 200 clients; the
 *  2026-11-17 build failed with EMAXCONN). Each build process then keeps ONE connection (DB_BUILD_POOL_MAX to change it) and
 *  waits longer for it; next.config.ts also caps the build at 2 static-generation workers. Runtime instances keep 5. */
export const BUILDING = process.env.NEXT_PHASE === "phase-production-build";
export const POOL_MAX = BUILDING ? Math.max(1, Number(process.env.DB_BUILD_POOL_MAX) || 1) : 5;
/** Supabase's transaction pooler (port 6543) on the same host: it holds a database connection only while a query or
 * transaction runs, so a burst of instances no longer needs one session-pooler slot (5432) each. */
export function transactionPoolerUrl(databaseUrl:string) {
 const url=new URL(databaseUrl);
 if(url.hostname.endsWith(".pooler.supabase.com"))url.port="6543";
 return url.toString();
}
export function getDb() {
 const url=process.env.DATABASE_URL;
 if (!url) throw new Error("DATABASE_URL is required. Configure the Supabase PostgreSQL connection in .env.local or Vercel.");
 assertDatabaseTarget(url,process.env.SUPABASE_PROJECT_REF);
 // node-postgres sends one query at a time per client and queues the rest in the pool, which the transaction pooler
 // handles (postgres.js pipelined queries on one connection and hung there). Idle clients close after 5 s, and
 // attachDatabasePool keeps a Vercel instance awake until they have, so a paused instance holds no sockets.
 let pool=shared.recsDbPool;
 if(!pool){
  pool=shared.recsDbPool=new Pool({connectionString:transactionPoolerUrl(url),max:POOL_MAX,idleTimeoutMillis:IDLE_SECONDS*1000,
   // A queued query in a build waits for the one connection instead of failing after 10 s.
   connectionTimeoutMillis:BUILDING?120_000:10_000});
  // Builds (or DB_POOL_LOG=1): the most connections this process held, printed at exit, so the build log shows the peak.
  if(BUILDING||process.env.DB_POOL_LOG==="1"){let peak=0;pool.on("connect",()=>{peak=Math.max(peak,pool!.totalCount);});process.on("exit",()=>console.log(`[db] pid ${process.pid} peak connections ${peak} (max ${POOL_MAX})`));}
  // A pooler-side disconnect of an idle client would otherwise be an unhandled 'error' event and crash the process.
  pool.on("error",error=>console.error("Idle database client error",error));
  attachDatabasePool(pool);
 }
 return drizzle(pool,{schema});
}
