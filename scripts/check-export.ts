import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { parseSnapshot,importSnapshot,verifySnapshot } from "../db/transfer";
import type { getDb } from "../db/index";
import { migrationSql } from "../db/migrations";
import { niche } from "../lib/niche";
const path=process.argv[2];if(!path)throw new Error("Usage: npm run db:check-export -- backups/export.json");
const snapshot=parseSnapshot(JSON.parse(await readFile(path,"utf8"))),engine=new PGlite();
try {
 for(const statement of migrationSql(niche.schema))await engine.exec(statement);
 const db=drizzle(engine) as unknown as ReturnType<typeof getDb>;
 await importSnapshot(db,snapshot);
 console.log("Local PostgreSQL-engine import verified without contacting any cloud database",await verifySnapshot(db,snapshot));
}finally{await engine.close();}
