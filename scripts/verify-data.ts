import { readFile } from "node:fs/promises";
import { parseSnapshot, verifySnapshot } from "../db/transfer";
import { connect } from "./connection";
const path=process.argv[2];if(!path)throw new Error("Usage: npm run db:verify -- backups/export.json");
const snapshot=parseSnapshot(JSON.parse(await readFile(path,"utf8"))),{db,client}=connect();
try{console.log("All exported values match",await verifySnapshot(db,snapshot));}finally{await client.end();}
