import "server-only";
// After a player signs in (magic link or the 6-digit code): if they already reserved a name, link this device's earlier guest
// posts under it (db/accounts.ts linkDevice, once per device).
import { database } from "../../db/data";
import { getAccount, linkDevice } from "../../db/accounts";
import { device } from "../../app/api/thread-device";

export async function afterSignIn(userId: string) {
  try {
    const db = await database(), account = await getAccount(db, userId), voter = await device(false);
    if (account && voter) await linkDevice(db, account, voter);
  } catch (error) { console.error("Linking earlier posts failed", error); }
}
