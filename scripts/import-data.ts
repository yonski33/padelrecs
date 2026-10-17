import { readFile } from "node:fs/promises";
import { parseSnapshot, importSnapshot } from "../db/transfer";
import { connect } from "./connection";
const path=process.argv[2];
if(!path)throw new Error("Usage: npm run db:import -- backups/export.json [--apply]");
const snapshot=parseSnapshot(JSON.parse(await readFile(path,"utf8")));
console.log("Validated snapshot",Object.fromEntries(Object.entries(snapshot.tables).map(([key,rows])=>[key,rows.length])));
if(process.argv.includes("--apply")){
 const {db,client}=connect();
 try{console.log("Import verified",await importSnapshot(db,snapshot));}finally{await client.end();}
}else console.log("Validation only. Add --apply after configuring the target database to import and verify transactionally.");
