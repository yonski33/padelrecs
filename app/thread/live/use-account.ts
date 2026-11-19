"use client";
// Who is posting, for the Thread composers (optional accounts): asked only when a Supabase session cookie is present, once per
// page view, so guests make no extra request and the cached pages stay the same for everyone.
import { useEffect, useState } from "react";

export type Me = { name: string; status: string } | null;
let check: Promise<Me> | null = null;
export function accountCheck(): Promise<Me> {
  if (typeof document === "undefined" || !/(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie)) return Promise.resolve(null);
  check ??= fetch("/api/account", { cache: "no-store" }).then(r => r.ok ? r.json() : null)
    .then((b: { account?: Me } | null) => b?.account ?? null).catch(() => null);
  return check;
}
/** After a sign-in, rename or sign-out on this page. */
export const forgetAccount = () => { check = null; };
export function useAccount() {
  const [me, setMe] = useState<Me>(null);
  useEffect(() => { let live = true; accountCheck().then(m => { if (live) setMe(m); }); return () => { live = false; }; }, []);
  return me;
}
/** The account page, coming back to this page (and its #section) afterwards. */
export const signInHref = (hash = "") => typeof window === "undefined" ? "/account" : `/account?next=${encodeURIComponent(window.location.pathname + window.location.search + hash)}`;
