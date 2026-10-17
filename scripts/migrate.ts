import { migrate } from "drizzle-orm/postgres-js/migrator";
import { connect } from "./connection";
const {db,client}=connect();
try{await migrate(db,{migrationsFolder:"./drizzle"});console.log("PostgreSQL migrations applied.");}
finally{await client.end();}
