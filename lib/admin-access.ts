export function allowedAdmin(userId:string|undefined,configured:string|undefined) {
 return !!userId && (configured||"").split(",").map(s=>s.trim()).filter(Boolean).includes(userId);
}
