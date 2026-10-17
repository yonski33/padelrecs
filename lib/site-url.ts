export function siteOrigin(requestUrl?:string) {
 if(process.env.SITE_URL){
  const canonical=new URL(process.env.SITE_URL).origin;
  const allowed=[canonical,...(process.env.SITE_ALLOWED_ORIGINS||"").split(",").map(value=>value.trim()).filter(Boolean).map(value=>new URL(value).origin)];
  if(requestUrl){
   const requested=new URL(requestUrl).origin;
   if(allowed.includes(requested))return requested;
  }
  return canonical;
 }
 if(process.env.NODE_ENV==="production")throw new Error("SITE_URL must be configured in production");
 return new URL(requestUrl||"http://localhost:3000").origin;
}
