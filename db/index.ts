import "server-only";
import { assertDatabaseTarget } from "../lib/deployment-target";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
// One pool per process: Next can load this module once per bundle layer (pages, route handlers), so it lives on globalThis.
const shared = globalThis as typeof globalThis & { recsDbPool?: Pool };
export const IDLE_SECONDS = 5;
export const POOL_MAX = 5;
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
  pool=shared.recsDbPool=new Pool({connectionString:transactionPoolerUrl(url),max:POOL_MAX,idleTimeoutMillis:IDLE_SECONDS*1000,connectionTimeoutMillis:10_000});
  // A pooler-side disconnect of an idle client would otherwise be an unhandled 'error' event and crash the process.
  pool.on("error",error=>console.error("Idle database client error",error));
  attachDatabasePool(pool);
 }
 return drizzle(pool,{schema});
}
