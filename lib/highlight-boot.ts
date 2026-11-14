/** Where the Highlights switch keeps a reader's choice, and the tiny script that applies a saved "off" before first paint
 *  (owner, 2026-11-14). Shared by the switch (app/highlight-toggle.tsx) and the root layout, which puts the script in <head>. */
export const HIGHLIGHT_KEY = "recs-highlights";
export const HIGHLIGHT_BOOT = `try{if(localStorage.getItem(${JSON.stringify(HIGHLIGHT_KEY)})==="off")document.documentElement.dataset.hl="off"}catch(e){}`;
