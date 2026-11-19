import "server-only";
// The signed-in player behind a request (optional accounts, drizzle/0028). Supabase Auth checks the session; the account row
// holds the reserved name. Only asked when a Supabase session cookie is present, so guests cost no Auth call.
import { cookies } from "next/headers";
import { getCurrentUser } from "../supabase/auth";
import { getAccount, type Account } from "../../db/accounts";
import type { getDb } from "../../db/index";

export const SESSION_COOKIE = /^sb-[^=]+-auth-token/;
export async function hasSessionCookie() { return (await cookies()).getAll().some(c => SESSION_COOKIE.test(c.name)); }

/** { user, account } for a signed-in visitor (account null until they reserve a name), or null for a guest. */
export async function currentPlayer(db: Pick<ReturnType<typeof getDb>, "select">): Promise<{ user: { id: string; email: string | null }; account: Account | null } | null> {
  if (!(await hasSessionCookie())) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  return { user: { id: user.id, email: user.email ?? null }, account: await getAccount(db, user.id) };
}

/** Where to go after signing in: a path on this site only. */
export const safeNext = (next: unknown) => typeof next === "string" && /^\/(?!\/)[\w\-./?=&%#]*$/.test(next) && !next.startsWith("/auth") ? next : "/account";
