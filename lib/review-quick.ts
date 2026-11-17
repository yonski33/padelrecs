// Quick inline edits on the admin review queue (owner 2026-11-17): only the reviewer's name, the submission date and the review
// text, with the public review form's own limits (app/api/reviews: name ≤ 50, text 20+ and the form's 2,000). Pure, for tests.
import { z } from "zod";

export const QUICK_TEXT_MAX = 2000;
const today = () => new Date().toISOString().slice(0, 10);
export const quickEditInput = z.discriminatedUnion("field", [
  z.object({ id: z.string().min(1).max(100), field: z.literal("alias"), value: z.string().trim().max(50) }),
  z.object({ id: z.string().min(1).max(100), field: z.literal("date"), value: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(v => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, "Not a date.")
    .refine(v => v <= today(), "No future dates.") }),
  z.object({ id: z.string().min(1).max(100), field: z.literal("text"), value: z.string().trim().min(20, "At least 20 characters, as on the review form.").max(QUICK_TEXT_MAX) }),
]);
export type QuickEdit = z.infer<typeof quickEditInput>;
/** The new created_at for a date edit: the picked day, the review's own time of day kept. */
export const withDate = (createdAt: string, day: string) => `${day}${createdAt.length > 10 ? createdAt.slice(10) : "T12:00:00.000Z"}`;
