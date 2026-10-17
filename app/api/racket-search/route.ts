import { getDb } from "../../../db";
import { rackets } from "../../../db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // Only public catalog names and URLs are sent to the browser.
  const results = await getDb().select({ name: rackets.name, slug: rackets.slug }).from(rackets).orderBy(asc(rackets.name));
  return Response.json(results);
}
