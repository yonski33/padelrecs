// Unfollow from a digest email (lib/thread/follow-digest.ts): the signed link lands here and one button does it, so a mail
// scanner opening the link changes nothing. No sign-in needed. Private like /account (proxy.ts), never cached or indexed.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Shell } from "../../thread/shell";
import { followSite } from "../../../lib/thread/sites";
import { checkFollowToken } from "../../../lib/thread/follow-digest";
import { niche } from "../../../lib/niche";
import { database } from "../../../db/data";
import { rackets } from "../../../db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unfollow", robots: { index: false, follow: false } };

export default async function Unfollow({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!followSite(niche.id)) notFound();
  const q = await searchParams, u = q.u ?? "", r = q.r ?? "", t = q.t ?? "";
  let body: React.ReactNode;
  if (q.done) body = <><h1 className="th-h1">Unfollowed</h1><div className="th-intro"><p>{q.done === "all" ? "You no longer follow any rackets, so the daily email stops." : "Done. That racket won't show in your daily email any more."}</p>
    <p><a className="th-link-b" href="/account">Manage what you follow</a></p></div></>;
  else if (!u || !r || !checkFollowToken(u, r, t)) body = <><h1 className="th-h1">That link didn&apos;t work</h1><div className="th-intro"><p>Sign in to see and change what you follow.</p><p><a className="th-link-b" href="/account">Go to your account</a></p></div></>;
  else {
    let name: string | null = null;
    if (r !== "all") try { const [x] = await (await database()).select({ name: rackets.name }).from(rackets).where(eq(rackets.id, r)); name = x?.name ?? null; } catch { /* name stays generic */ }
    const action = `/api/account/follows/unfollow?u=${encodeURIComponent(u)}&r=${encodeURIComponent(r)}&t=${encodeURIComponent(t)}`;
    body = <><h1 className="th-h1">{r === "all" ? "Unfollow all rackets?" : `Unfollow the ${name ?? "racket"}?`}</h1>
      <div className="th-intro"><p>{r === "all" ? "The daily email stops. You can follow rackets again any time from their pages." : "It won't show in your daily email any more."}</p></div>
      <form method="post" action={action}><button className="th-btn round lime">{r === "all" ? "Unfollow all" : "Unfollow"}</button></form></>;
  }
  return <Shell><main className="th-main"><div className="th-col" style={{ maxWidth: 620 }}><article className="th-card th-hero">{body}</article></div></main></Shell>;
}
