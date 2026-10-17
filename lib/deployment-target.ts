import targets from "../deployment/targets.json";
export function assertProjectRef(projectRef:string|undefined,confirmedRef=targets.supabaseProjectRef as string|null) {
 if(!projectRef||!confirmedRef||projectRef!==confirmedRef)throw new Error("No verified PadelRecs Supabase target. Record the new project's ref in deployment/targets.json and SUPABASE_PROJECT_REF before connecting.");
 if(targets.application!=="padelrecs"||targets.supabaseProjectName.toLowerCase()!=="padelrecs"||targets.protectedExistingSupabaseProjectRefs.includes(projectRef))throw new Error("Protected existing project: refusing to connect.");
 return projectRef;
}
export function assertDatabaseTarget(databaseUrl:string,projectRef:string|undefined,confirmedRef=targets.supabaseProjectRef as string|null) {
 const ref=assertProjectRef(projectRef,confirmedRef),url=new URL(databaseUrl);
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
