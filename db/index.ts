import "server-only";
import { assertDatabaseTarget } from "../lib/deployment-target";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
let connection: ReturnType<typeof postgres> | undefined;
export const IDLE_SECONDS = 5;
export function getDb() {
 const url=process.env.DATABASE_URL;
 if (!url) throw new Error("DATABASE_URL is required. Configure the Supabase PostgreSQL connection in .env.local or Vercel.");
 assertDatabaseTarget(url,process.env.SUPABASE_PROJECT_REF);
 // Session pooler (port 5432): every Recs site shares its pool_size (15) slots, and a connection holds a slot until it
 // closes, so each instance keeps one small connection and gives it back after 5 s without queries.
 // (The transaction pooler, port 6543, hangs on postgres.js's pipelined queries, e.g. catalog()'s Promise.all.)
 connection ??= postgres(url,{prepare:false,max:1,idle_timeout:IDLE_SECONDS,connect_timeout:10});
 return drizzle(connection,{schema});
}
