import { connect } from "./connection";
import { seed } from "../db/seed-data";
import { brands, rackets } from "../db/schema";
if(process.env.NODE_ENV==="production")throw new Error("Starter catalog seeding is disabled in production. Import your actual snapshot instead.");
const {db,client}=connect();
try{await db.transaction(async tx=>{await tx.insert(brands).values(seed.brands).onConflictDoNothing();for(const racket of seed.rackets)await tx.insert(rackets).values(racket).onConflictDoNothing();});console.log("Starter brands/rackets only. No fictional reviews were inserted.");}finally{await client.end();}
