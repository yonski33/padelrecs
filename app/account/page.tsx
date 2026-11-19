// /account (PadelRecs Thread): optional player accounts. Sign in with an email link (no passwords), reserve a name, set level
// and side, sign out, delete the account. Private: never cached or indexed (proxy.ts PRIVATE), so public pages stay cached
// and only this page and /api/account know who is signed in.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "../thread/shell";
import { AccountPanel } from "../thread/live/account";
import { threadSite } from "../../lib/thread/look";
import { niche } from "../../lib/niche";
import { database } from "../../db/data";
import { currentPlayer, safeNext } from "../../lib/thread/account-session";
import { profileValues } from "../../lib/review-options";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!threadSite(niche.id)) notFound();
  const q = await searchParams;
  let me: Awaited<ReturnType<typeof currentPlayer>> = null;
  try { if (process.env.DATABASE_URL) me = await currentPlayer(await database()); } catch (error) { console.error("Account page read failed", error); }
  const initial = me ? { signedIn: true as const, email: me.user.email, account: me.account && { name: me.account.name, level: me.account.level, side: me.account.side, status: me.account.status } } : { signedIn: false as const };
  return <Shell>
    <main className="th-main">
      <div className="th-col" style={{ maxWidth: 620 }}>
        <AccountPanel initial={initial} next={q.next ? safeNext(q.next) : null} failed={q.signin === "failed"}
          levels={profileValues("playerLevel")} sides={profileValues("playingSide")}/>
      </div>
    </main>
  </Shell>;
}
