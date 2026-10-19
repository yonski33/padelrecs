import { rm } from "node:fs/promises";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { migrationsFolderFor, migrationsTable } from "../db/migrations";
// Applies drizzle/ to the active niche's schema (NICHE, default padel); see db/migrations.ts.
const folder=await migrationsFolderFor(niche.schema);
const {db,client}=connect();
try{
 await migrate(db,{migrationsFolder:folder,migrationsTable:migrationsTable(niche.schema)});
 console.log(`PostgreSQL migrations applied to schema "${niche.schema}" (${niche.site.name}).`);
}finally{await client.end();await rm(folder,{recursive:true,force:true});}
