import targets from "../deployment/targets.json";
import { niche as activeNiche, type Niche } from "./niche";
/** Each niche's tables live in its own schema of the one verified project; targets.json lists which schema belongs to which niche. */
export function assertNicheSchema(niche:Pick<Niche,"id"|"schema">=activeNiche,recorded:Record<string,string>=targets.nicheSchemas) {
 if(!Object.hasOwn(recorded,niche.id)||recorded[niche.id]!==niche.schema)throw new Error(`Niche "${niche.id}" (schema "${niche.schema}") is not recorded in deployment/targets.json nicheSchemas: refusing to connect.`);
 if(Object.entries(recorded).some(([id,schema])=>id!==niche.id&&schema===niche.schema))throw new Error(`Schema "${niche.schema}" is recorded for another niche: refusing to connect.`);
 return niche.schema;
}
export function assertProjectRef(projectRef:string|undefined,confirmedRef=targets.supabaseProjectRef as string|null) {
 if(!projectRef||!confirmedRef||projectRef!==confirmedRef)throw new Error("No verified PadelRecs Supabase target. Record the new project's ref in deployment/targets.json and SUPABASE_PROJECT_REF before connecting.");
 if(targets.application!=="padelrecs"||targets.supabaseProjectName.toLowerCase()!=="padelrecs"||targets.protectedExistingSupabaseProjectRefs.includes(projectRef))throw new Error("Protected existing project: refusing to connect.");
 return projectRef;
}
export function assertDatabaseTarget(databaseUrl:string,projectRef:string|undefined,confirmedRef=targets.supabaseProjectRef as string|null) {
 const ref=assertProjectRef(projectRef,confirmedRef),url=new URL(databaseUrl);
 assertNicheSchema();
 if(!["postgres:","postgresql:"].includes(url.protocol))throw new Error("Expected PostgreSQL connection");
 if(targets.protectedExistingSupabaseProjectRefs.some(id=>url.hostname.includes(id)||decodeURIComponent(url.username).includes(id)))throw new Error("Protected existing database: refusing to connect.");
 const direct=url.hostname===`db.${ref}.supabase.co`;
 const pooled=url.hostname.endsWith(".pooler.supabase.com")&&decodeURIComponent(url.username)===`postgres.${ref}`;
 if(!direct&&!pooled)throw new Error("Database connection does not match the verified PadelRecs Supabase project.");
}
export function assertAuthTarget(authUrl:string,projectRef:string|undefined,confirmedRef=targets.supabaseProjectRef as string|null) {
 const ref=assertProjectRef(projectRef,confirmedRef),url=new URL(authUrl);
 if(url.protocol!=="https:"||url.hostname!==`${ref}.supabase.co`)throw new Error("Auth URL does not match the verified PadelRecs Supabase project.");
}
