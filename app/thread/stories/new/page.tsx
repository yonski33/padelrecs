// Write a story (PadelRecs pilot): the members-only composer, with the catalogue's rackets for its tag picker.
import type { Metadata } from "next";
import { Shell } from "../../shell";
import { StoryComposer } from "../../live/story-composer";
import { threadRows } from "../../data";
import { niche } from "../../../../lib/niche";

export const revalidate = 21600;
export const metadata: Metadata = { title: { absolute: `Write a story | ${niche.site.name}` }, alternates: { canonical: "/stories/new" }, robots: { index: false, follow: true } };

export default async function NewStory() {
  const { all } = await threadRows();
  const rackets = all.filter(r => r.current !== false).map(r => ({ id: r.id, name: r.name })).sort((a, b) => a.name.localeCompare(b.name));
  return <Shell><main className="th-main"><div className="th-col"><StoryComposer rackets={rackets}/></div></main></Shell>;
}
