// The admin Stories tab (PadelRecs pilot): members' stories by status, newest first, with a search, Approve / Hold / Reject,
// Delete and Edit. Server-drawn; the moderation buttons are plain forms to /api/funtimes/stories. Edit (owner 2026-11-22)
// opens /funtimes/story/<id>: the members' editor in admin mode for any story.
import { database } from "../../db/data";
import { adminStories, type StoryStatus } from "../../db/stories";
import { storyDescription } from "../../lib/thread/stories";

const TABS: [StoryStatus | "all" | "edits", string][] = [["pending", "Waiting"], ["edits", "Edits waiting"], ["approved", "Live"], ["rejected", "Rejected"], ["all", "All"]];

export async function StoriesAdmin({ status, result, q }: { status?: string; result?: string; q?: string }) {
  const s = (TABS.find(([k]) => k === status)?.[0] ?? "pending") as StoryStatus | "all" | "edits";
  const term = (q ?? "").trim().toLowerCase().slice(0, 80);
  let list: Awaited<ReturnType<typeof adminStories>> = [], err = "";
  try { list = await adminStories(await database(), s, term ? 500 : 50); } catch { err = "The stories table isn't there yet (migration 0031 waits for the owner's OK)."; }
  // Search: title, author and text, in the order the list is in (newest first).
  if (term) list = list.filter(x => `${x.title}\n${x.author.name}\n${x.body}`.toLowerCase().includes(term)).slice(0, 50);
  const form = (id: string, fields: Record<string, string>, label: string) => <form method="post" action="/api/funtimes/stories" style={{ display: "inline" }}>
    <input type="hidden" name="id" value={id}/><input type="hidden" name="back" value={s}/>{Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}
    <button className="text-button">{label}</button></form>;
  return <section className="admin-queue">
    <nav className="admin-nav" aria-label="Story status">{TABS.map(([k, l]) => <a key={k} href={`/funtimes?tab=stories&status=${k}`} aria-current={k === s ? "page" : undefined}>{l}</a>)}</nav>
    <form method="get" action="/funtimes" className="admin-search" style={{ display: "flex", gap: 8, margin: "8px 0" }}>
      <input type="hidden" name="tab" value="stories"/><input type="hidden" name="status" value={s}/>
      <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search title, author or text" aria-label="Search stories" style={{ flex: 1, minWidth: 0 }}/>
      <button className="text-button">Search</button>{term && <a href={`/funtimes?tab=stories&status=${s}`}>Clear</a>}
    </form>
    {result && <p className="muted">{`Done: ${result}`}</p>}
    {err ? <p className="muted">{err}</p> : list.length === 0 ? <p className="muted">{term ? "No story matches that." : "Nothing here."}</p> : list.map(x => <article key={x.id} className="admin-card">
      <h3>{x.status === "approved" ? <a href={`/stories/${x.slug}`}>{x.title}</a> : x.title}</h3>
      <p className="muted">{`${x.author.name} · ${x.at.slice(0, 10)} · ${x.status}${x.spamScore ? ` · spam score ${x.spamScore}` : ""} · ${x.body.length} characters · ${x.rackets.length} rackets${x.editedAt ? ` · edited ${x.editedAt.slice(0, 10)}` : ""}`}</p>
      <p>{storyDescription(x.body)}</p>
      <details><summary>Read it all</summary><p style={{ whiteSpace: "pre-wrap" }}>{x.body}</p></details>
      {x.pendingEdit && <div className="admin-card" style={{ borderStyle: "dashed" }}><p className="muted">{`Edit waiting (${x.pendingEdit.at.slice(0, 10)}): the live text stays until you approve it.`}</p>
        <h4>{x.pendingEdit.title}</h4><details><summary>Read the edit</summary><p style={{ whiteSpace: "pre-wrap" }}>{x.pendingEdit.body}</p></details>
        <p>{form(x.id, { action: "edit", decide: "approve" }, "Approve edit")} {form(x.id, { action: "edit", decide: "reject" }, "Turn down edit")}</p></div>}
      <p><a href={`/funtimes/story/${x.id}`}>Edit</a>{" "}{x.status !== "approved" && form(x.id, { action: "status", status: "approved" }, "Approve")} {x.status !== "pending" && form(x.id, { action: "status", status: "pending" }, "Hold")}{" "}
        {x.status !== "rejected" && form(x.id, { action: "status", status: "rejected" }, "Reject")} {form(x.id, { action: "delete", confirm: "yes" }, "Delete")}</p>
    </article>)}
  </section>;
}
