export function siteOrigin(requestUrl?:string) {
 if(process.env.SITE_URL)return new URL(process.env.SITE_URL).origin;
 if(process.env.NODE_ENV==="production")throw new Error("SITE_URL must be configured in production");
 return new URL(requestUrl||"http://localhost:3000").origin;
}
