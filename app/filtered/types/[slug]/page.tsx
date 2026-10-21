import { TypeDirectory, typeMetadata } from "../../../types/type-directory";

// A type page with ?brand= or ?sort= is rewritten here (next.config.ts); the plain page stays static.
export const generateMetadata = typeMetadata;

export default function FilteredTypePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ brand?: string; sort?: string }> }) {
  return <TypeDirectory params={params} searchParams={searchParams}/>;
}
