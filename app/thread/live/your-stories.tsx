"use client";
// "Your stories" on /account (owner 2026-11-20): a member's own stories with their status, Edit and Delete. PadelRecs only
// (stories are a padel pilot); empty elsewhere and for members with no stories.
import { useEffect, useState } from "react";
import { th } from "../../../lib/thread/look";

type Mine = { id: string; slug: string; title: string; status: "pending" | "approved" | "rejected"; at: string; editedAt: string | null; editWaiting: boolean };
const day = (at: string) => new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const STATUS = { approved: "Live", pending: "Waiting for a check", rejected: "Not shown" } as const;

export function YourStories() {
  const [list, setList] = useState<Mine[] | null>(null), [error, setError] = useState("");
  useEffect(() => { fetch("/api/stories?mine=1", { cache: "no-store" }).then(r => r.ok ? r.json() : { stories: [] }).then((b: { stories?: Mine[] }) => setList(b.stories ?? [])).catch(() => setList([])); }, []);
  if (!list?.length) return null;
  async function remove(s: Mine) {
    if (!window.confirm(`Delete "${s.title}" and its comments for good?`)) return;
    const r = await fetch(`/api/stories?id=${s.id}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) { setList(l => (l ?? []).filter(x => x.id !== s.id)); setError(""); } else setError("Could not delete that. Try again?");
  }
  return <section className="th-card th-sec"><h2 className="th-h2">Your stories</h2>
    {error && <span className="th-err" role="alert">{error}</span>}
    <ul className="th-own">{list.map(s => <li key={s.id}>
      <div className="th-own-top">{s.status === "approved" ? <a className="th-story-t" href={th(`/stories/${s.slug}`)}>{s.title}</a> : <strong>{s.title}</strong>}</div>
      <span className="th-own-meta">{[STATUS[s.status], s.editWaiting ? "edit waiting for a check" : "", day(s.at), s.editedAt ? `edited ${day(s.editedAt)}` : ""].filter(Boolean).join(" · ")}</span>
      <div className="th-own-act"><a className="th-link-b" href={th(`/stories/${s.slug}/edit`)}>Edit</a><button type="button" className="text-button" onClick={() => remove(s)}>Delete</button></div>
    </li>)}</ul></section>;
}
