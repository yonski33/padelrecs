import { z } from "zod";
import { niche } from "./niche";
import type { ProfileField } from "./niche/types";

// Values the active niche accepts for player-profile fields and web-review sources. Shared by the public form API and admin editing.
const oneOf = (values: string[]) => z.enum(values as [string, ...string[]]);
export const profileValues = (field: ProfileField) => niche.profile[field].options.map(o => o.value);
/** An optional profile answer: one of the niche's values, or "" for "not answered". */
export const profileChoice = (field: ProfileField) => z.union([z.literal(""), oneOf(profileValues(field))]);
export const sourcePlatform = oneOf(niche.sourcePlatforms);
