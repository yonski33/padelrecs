// The light design is the default (owner, 2026-11-12). ?look=classic still shows the old one while the redesign is reviewed.
export const isLight = (look?: string | string[]) => (Array.isArray(look) ? look[0] : look) !== "classic";
