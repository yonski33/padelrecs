// Types for scripts/import-curated.mjs (its pure helpers are tested in tests/curated.test.ts).
export function keyOf(combo: string | null | undefined): string | null;
export function listOf(file: { combo?: string; picks?: { slug?: string; reason?: string; source?: string; owner?: boolean; exception?: string }[] } | null | undefined): { slug: string; owner?: boolean; note?: string; src?: string; exception?: string }[];
export function newestOf(slug: string, catalog: { slug: string; reviews?: number }[], min?: number): string;
