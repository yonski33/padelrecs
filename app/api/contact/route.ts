import { database } from "../../../db/data";
import { issueFormToken } from "../../../lib/form-token";
import { createContactHandler } from "./handler";

// The form fetches this when it opens; see lib/form-token.ts.
export function GET(){return Response.json({token:issueFormToken()},{headers:{"Cache-Control":"no-store"}});}
// Sends with Resend using RESEND_API_KEY and CONTACT_TO (see handler.ts and lib/contact.ts).
export const POST=createContactHandler({database});
export const dynamic="force-dynamic";
