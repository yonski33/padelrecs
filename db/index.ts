import "server-only";
import { assertDatabaseTarget } from "../lib/deployment-target";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
let connection: ReturnType<typeof postgres> | undefined;
export function getDb() {
 const url=process.env.DATABASE_URL;
 if (!url) throw new Error("DATABASE_URL is required. Configure the Supabase PostgreSQL connection in .env.local or Vercel.");
 assertDatabaseTarget(url,process.env.SUPABASE_PROJECT_REF);
 // prepare:false supports Supabase's transaction pooler. Keep each serverless instance small.
 connection ??= postgres(url,{prepare:false,max:1,idle_timeout:20,connect_timeout:10});
 return drizzle(connection,{schema});
}
