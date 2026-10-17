import {test} from "node:test";
import assert from "node:assert/strict";
import {assertProjectRef,assertDatabaseTarget,assertAuthTarget} from "../lib/deployment-target";
test("no cloud connection until a separate PadelRecs ref is recorded",()=>{
 assert.throws(()=>assertProjectRef("anything"),/verified PadelRecs/);
});
test("known existing production project is always blocked, even if mistakenly entered as the target",()=>{
 const protectedRef="adxxysbmpwlfebjbzixl";
 assert.throws(()=>assertProjectRef(protectedRef,protectedRef),/Protected/);
 assert.throws(()=>assertDatabaseTarget(`postgres://postgres:password@db.${protectedRef}.supabase.co/postgres`,protectedRef,protectedRef),/Protected/);
});
test("database and authentication URLs must match the exact confirmed new project",()=>{
 const ref="newpadelrecsprojectref";
 assert.doesNotThrow(()=>assertDatabaseTarget(`postgres://postgres:password@db.${ref}.supabase.co:5432/postgres`,ref,ref));
 assert.doesNotThrow(()=>assertDatabaseTarget(`postgres://postgres.${ref}:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,ref,ref));
 assert.doesNotThrow(()=>assertAuthTarget(`https://${ref}.supabase.co`,ref,ref));
 assert.throws(()=>assertDatabaseTarget("postgres://postgres:password@db.unrelated.supabase.co/postgres",ref,ref),/does not match/);
 assert.throws(()=>assertAuthTarget("https://unrelated.supabase.co",ref,ref),/does not match/);
});
