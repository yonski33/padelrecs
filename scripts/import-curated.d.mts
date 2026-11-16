// Types for scripts/import-curated.mjs (its pure helpers are tested in tests/curated.test.ts).
export function keyOf(combo: string | null | undefined): string | null;
export function listOf(file: { combo?: string; picks?: { slug?: string; reason?: string; source?: string }[] } | null | undefined): { slug: string; note?: string; src?: string }[];
