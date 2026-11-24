"use client";
// The review form's signed "opened at" token (lib/form-token.ts), fetched when the form shows up and reused when it posts.
// Fetching it right before the POST made every review "too fast" (under 3 s) and the server filed it as rejected (owner's
// test review, 2026-11-18). Shared by every review form that posts to /api/reviews.
import { useEffect, useRef } from "react";

const fetchToken = () => fetch("/api/reviews", { cache: "no-store" }).then(r => r.ok ? r.json() : {}).then((b: { token?: string }) => b.token || "").catch(() => "");

/** Starts fetching the token on mount; the returned function gives it at post time (fetching then only if the first try failed). */
export function useFormToken() {
  const token = useRef<Promise<string> | null>(null);
  useEffect(() => { token.current ??= fetchToken(); }, []);
  return async () => { const t = await (token.current ??= fetchToken()); if (!t) token.current = null; return t; };
}
