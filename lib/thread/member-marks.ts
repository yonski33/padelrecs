// Member marks for cached pages (optional accounts): which posts belong to an active account. No session or cookie reads, so
// the racket pages stay cached (tests/view-pages: nothing forces a render per request). None before drizzle/0028 runs.
import type { getDb } from "../../db/index";
import { memberPosts, memberProfiles, type MemberProfile, type PostKind } from "../../db/accounts";

export const missingTable = (e: unknown) => /does not exist|42P01/.test(String((e as { code?: string })?.code ?? "") + String((e as Error)?.message ?? e) + String((e as { cause?: { code?: string } })?.cause?.code ?? ""));
export async function memberSet(db: Pick<ReturnType<typeof getDb>, "select">, kind: PostKind, ids: string[]) {
  try { return await memberPosts(db, kind, ids); } catch (error) { if (!missingTable(error)) console.error("Member marks failed", error); return new Set<string>(); }
}
/** Member marks with the account's live level and side; none before the migration. */
export async function memberMap(db: Pick<ReturnType<typeof getDb>, "select">, kind: PostKind, ids: string[]) {
  try { return await memberProfiles(db, kind, ids); } catch (error) { if (!missingTable(error)) console.error("Member marks failed", error); return new Map<string, MemberProfile>(); }
}
