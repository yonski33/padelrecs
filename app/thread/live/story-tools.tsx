"use client";
// Edit and Delete on a story page, for its author or an admin only (owner 2026-11-20). Asked in the browser
// (/api/stories?can=), so the cached page is the same for everyone.
import { useEffect, useState } from "react";
import { th } from "../../../lib/thread/look";

export function StoryTools({ slug, id }: { slug: string; id: string }) {
  const [can, setCan] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    if (!/(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie)) return;
    let live = true;
    fetch(`/api/stories?can=${encodeURIComponent(slug)}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then((b: { canEdit?: boolean } | null) => { if (live) setCan(!!b?.canEdit); }).catch(() => {});
    return () => { live = false; };
  }, [slug]);
  if (!can) return null;
  async function remove() {
    if (busy || !window.confirm("Delete this story and its comments for good?")) return;
    setBusy(true); setError("");
    const r = await fetch(`/api/stories?id=${id}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) { window.location.href = th("/stories"); return; }
    setError("Could not delete that. Try again?"); setBusy(false);
  }
  return <span className="th-story-tools"><a href={th(`/stories/${slug}/edit`)}>Edit</a><button type="button" onClick={remove} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button>
    {error && <span className="th-err" role="alert">{error}</span>}</span>;
}
