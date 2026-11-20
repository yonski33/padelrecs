// The admin Stories tab (PadelRecs pilot): members' stories by status, with Approve / Hold / Reject and Delete. Server-drawn;
// the buttons are plain forms to /api/funtimes/stories.
import { database } from "../../db/data";
import { adminStories, type StoryStatus } from "../../db/stories";
import { storyDescription } from "../../lib/thread/stories";

const TABS: [StoryStatus | "all", string][] = [["pending", "Waiting"], ["approved", "Live"], ["rejected", "Rejected"], ["all", "All"]];
export async function StoriesAdmin({ status, result }: { status?: string; result?: string }) {
  const s = (TABS.find(([k]) => k === status)?.[0] ?? "pending") as StoryStatus | "all";
  let list: Awaited<ReturnType<typeof adminStories>> = [], err = "";
  try { list = await adminStories(await database(), s); } catch { err = "The stories table isn't there yet (migration 0031 waits for the owner's OK)."; }
  const form = (id: string, fields: Record<string, string>, label: string) => <form method="post" action="/api/funtimes/stories" style={{ display: "inline" }}>
    <input type="hidden" name="id" value={id}/><input type="hidden" name="back" value={s}/>{Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}
    <button className="text-button">{label}</button></form>;
  return <section className="admin-queue">
    <nav className="admin-nav" aria-label="Story status">{TABS.map(([k, l]) => <a key={k} href={`/funtimes?tab=stories&status=${k}`} aria-current={k === s ? "page" : undefined}>{l}</a>)}</nav>
    {result && <p className="muted">{`Done: ${result}`}</p>}
    {err ? <p className="muted">{err}</p> : list.length === 0 ? <p className="muted">Nothing here.</p> : list.map(x => <article key={x.id} className="admin-card">
      <h3>{x.status === "approved" ? <a href={`/stories/${x.slug}`}>{x.title}</a> : x.title}</h3>
      <p className="muted">{`${x.author.name} · ${x.at.slice(0, 10)} · ${x.status}${x.spamScore ? ` · spam score ${x.spamScore}` : ""} · ${x.body.length} characters · ${x.rackets.length} rackets`}</p>
      <p>{storyDescription(x.body)}</p>
      <details><summary>Read it all</summary><p style={{ whiteSpace: "pre-wrap" }}>{x.body}</p></details>
      <p>{x.status !== "approved" && form(x.id, { action: "status", status: "approved" }, "Approve")} {x.status !== "pending" && form(x.id, { action: "status", status: "pending" }, "Hold")}{" "}
        {x.status !== "rejected" && form(x.id, { action: "status", status: "rejected" }, "Reject")} {form(x.id, { action: "delete", confirm: "yes" }, "Delete")}</p>
    </article>)}
  </section>;
}
