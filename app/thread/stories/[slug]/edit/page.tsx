// Edit a story (owner 2026-11-20): the same editor, prefilled for its author or an admin (checked by /api/stories?edit=).
import type { Metadata } from "next";
import { Shell } from "../../../shell";
import { StoryComposer } from "../../../live/story-composer";
import { threadRows } from "../../../data";
import { niche } from "../../../../../lib/niche";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: `Edit story | ${niche.site.name}` }, robots: { index: false, follow: false } };
type P = { params: Promise<{ slug: string }> };

export default async function EditStory({ params }: P) {
  const [{ slug }, { all }] = await Promise.all([params, threadRows()]);
  const rackets = all.filter(r => r.current !== false).map(r => ({ id: r.id, name: r.name })).sort((a, b) => a.name.localeCompare(b.name));
  return <Shell active="stories"><main className="th-main"><div className="th-col"><StoryComposer rackets={rackets} edit={slug}/></div></main></Shell>;
}
