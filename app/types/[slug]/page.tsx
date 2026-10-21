import { TypeDirectory, typeMetadata } from "../type-directory";

// Static and cached at the edge; see lib/revalidate.ts. Each type page renders on its first visit and is then cached.
// Filtered and sorted versions are rewritten to app/filtered/types/[slug].
export const revalidate = 300;
export async function generateStaticParams() { return []; }
export const generateMetadata = typeMetadata;

export default function TypePage({ params }: { params: Promise<{ slug: string }> }) {
  return <TypeDirectory params={params} searchParams={Promise.resolve({})}/>;
}
