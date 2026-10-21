import { HomeFeed, homeMetadata } from "./home-feed";

// Static and cached at the edge; see lib/revalidate.ts. Filtered feeds (?source=, ?type=, ?show=) are rewritten to app/filtered.
export const revalidate = 300;
export const metadata = homeMetadata;

export default function Home() {
  return <HomeFeed searchParams={Promise.resolve({})}/>;
}
