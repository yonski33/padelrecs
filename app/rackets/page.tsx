import { Directory, catalogMetadata } from "./directory";

// Static and cached at the edge; see lib/revalidate.ts. Filtered and sorted lists are rewritten to app/filtered/catalog.
export const revalidate = 300;
export const metadata = catalogMetadata;

export default function Rackets() {
  return <Directory searchParams={Promise.resolve({})}/>;
}
