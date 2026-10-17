import { assertDatabaseTarget } from "../lib/deployment-target";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema";
export function connect(){
 const url=process.env.MIGRATION_DATABASE_URL||process.env.DATABASE_URL;
 if(!url)throw new Error("Set MIGRATION_DATABASE_URL or DATABASE_URL in .env.local");
 assertDatabaseTarget(url,process.env.SUPABASE_PROJECT_REF);
 const client=postgres(url,{prepare:false,max:1});
 return {client,db:drizzle(client,{schema})};
}
