/** URL-safe slug: "Nox AT10 Genius 12K 2025" -> "nox-at10-genius-12k-2025". Shared by the server and admin forms. */
export const slugify=(name:string)=>name.normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"");
