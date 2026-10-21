import { Directory, catalogMetadata } from "../../rackets/directory";

// The catalogue with ?q=, ?brand=, ?year=, ?shape= or ?sort= is rewritten here (next.config.ts); the plain list stays static.
export const metadata = catalogMetadata;

export default function FilteredRackets({ searchParams }: { searchParams: Promise<{ q?: string; brand?: string; year?: string; shape?: string; sort?: string }> }) {
  return <Directory searchParams={searchParams}/>;
}
