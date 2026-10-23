/** Languages web-review sources are translated from, by ISO 639-1 code. Unknown codes show as the code itself. */
const NAMES: Record<string, string> = { es: "Spanish", pt: "Portuguese", it: "Italian", fr: "French", de: "German", nl: "Dutch", sv: "Swedish", ar: "Arabic" };
export const languageName = (code: string | null | undefined) => code ? NAMES[code.toLowerCase()] ?? code : null;
/** A web review's quote in English: the translation when the source is in another language, otherwise the excerpt. */
export const englishQuote = (e: { excerpt: string | null; excerptTranslation?: string | null; sourceLanguage?: string | null }) =>
  e.sourceLanguage && e.sourceLanguage !== "en" ? e.excerptTranslation ?? null : e.excerpt;
