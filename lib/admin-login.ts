import {allowedAdmin} from "./admin-access";

type PasswordAuth={
 signInWithPassword(credentials:{email:string,password:string}):Promise<{data:{user:{id:string}|null},error:{status?:number}|null}>;
 signOut(options:{scope:"local"}):Promise<unknown>;
};
export async function signInAdminWithPassword(auth:PasswordAuth,email:string,password:string,adminIds:string|undefined){
 const {data,error}=await auth.signInWithPassword({email,password});
 if(error)return error.status===429?"rate-limited":"invalid";
 if(!allowedAdmin(data.user?.id,adminIds)){
  await auth.signOut({scope:"local"});
  return "invalid";
 }
 return "success";
}
