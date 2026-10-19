import { readFile } from "node:fs/promises";
import { parseSnapshot, importSnapshot } from "../db/transfer";
import { connect } from "./connection";
import { niche } from "../lib/niche";
import { snapshotSchema } from "../db/transfer";
const path=process.argv[2];
if(!path)throw new Error("Usage: npm run db:import -- backups/export.json [--apply]");
const snapshot=parseSnapshot(JSON.parse(await readFile(path,"utf8")));
console.log("Validated snapshot",Object.fromEntries(Object.entries(snapshot.tables).map(([key,rows])=>[key,rows.length])));
const from=snapshotSchema(snapshot);
// A padel backup must never land in another niche's tables by accident.
if(from!==niche.schema&&!process.argv.includes("--from-other-schema"))throw new Error(`This snapshot came from schema "${from}" but NICHE=${niche.id} uses "${niche.schema}". Add --from-other-schema only if that is intended.`);
if(process.argv.includes("--apply")){
 console.log(`Importing into schema "${niche.schema}" (${niche.site.name}).`);
 const {db,client}=connect();
 try{console.log("Import verified",await importSnapshot(db,snapshot));}finally{await client.end();}
}else console.log("Validation only. Add --apply after configuring the target database to import and verify transactionally.");
