import { HomeFeed, homeMetadata } from "../home-feed";

// "/" with ?source=, ?type= or ?show= is rewritten here (next.config.ts), because reading the query makes a page dynamic.
// The plain "/" stays static in app/page.tsx. The canonical address in the metadata is still "/".
export const metadata = homeMetadata;

export default function FilteredHome({ searchParams }: { searchParams: Promise<{ source?: string | string[]; show?: string | string[]; type?: string | string[] }> }) {
  return <HomeFeed searchParams={searchParams}/>;
}
