import "server-only";
// Posting with optional accounts (PadelRecs Thread reviews and comments). A signed-in member posts under their reserved name
// (whatever the box said); a guest can't use a reserved name. Until drizzle/0028 runs the account tables are missing: then
// every post is a guest post, exactly as before.
import type { getDb } from "../../db/index";
import { nameOwner, recordPost, recordReviewDevice, type Account, type PostKind } from "../../db/accounts";
import { missingTable } from "./member-marks";
export { memberSet } from "./member-marks";
import { currentPlayer } from "./account-session";

type Database = ReturnType<typeof getDb>;
export type Poster = { kind: "member"; account: Account } | { kind: "guest" } | { kind: "blocked" } | { kind: "reserved" };
export const RESERVED = "That name belongs to a member. Sign in if it's yours, or pick another.";
export const BLOCKED = "This account can't post right now. Use the contact page if that looks wrong.";

export async function postingAs(db: Database, typed: string | null | undefined): Promise<Poster> {
  try {
    const me = await currentPlayer(db);
    if (me?.account) return me.account.status === "blocked" ? { kind: "blocked" } : { kind: "member", account: me.account };
    if (typed?.trim()) { const owner = await nameOwner(db, typed); if (owner && owner.id !== me?.user.id) return { kind: "reserved" }; }
  } catch (error) { if (!missingTable(error)) console.error("Account check failed", error); }
  return { kind: "guest" };
}
/** After the post is saved: tie it to the member, or keep a guest review's device for a later sign-in. */
export async function afterPost(db: Database, kind: PostKind, id: string, poster: Poster, voter: string | null) {
  try {
    if (poster.kind === "member") await recordPost(db, kind, id, poster.account.id);
    else if (kind === "review" && voter) await recordReviewDevice(db, id, voter);
  } catch (error) { if (!missingTable(error)) console.error("Account post link failed", error); }
}
