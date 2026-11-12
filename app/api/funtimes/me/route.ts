import {isAdmin} from "../../../funtimes/auth";
/** Whether the visitor is the signed-in owner, for the admin-only "Edit" links on public review cards (app/admin-edit.tsx). */
export async function GET(){
 return Response.json({admin:await isAdmin()},{headers:{"Cache-Control":"private, no-store"}});
}
