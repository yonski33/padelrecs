// The beauty product page's type (owner 2026-11-16, Claude Design "SkinRecs product page"): Instrument Serif for display,
// Figtree for text, DM Mono for small labels. Loaded only where the beauty product page renders (app/skin/skin-product.tsx).
import { Instrument_Serif, Figtree, DM_Mono } from "next/font/google";
export const bpSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap", variable: "--bp-serif" });
export const bpSans = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--bp-sans" });
export const bpMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--bp-mono" });
export const bpFontVars = `${bpSerif.variable} ${bpSans.variable} ${bpMono.variable}`;
/** The same variables on <body>, so the shared site header and footer (outside the page's <main>) can use the beauty fonts on
 *  these pages without the header importing them (padel's header stays as it is). */
export const bpBodyFonts = `body{--bp-serif:${bpSerif.style.fontFamily};--bp-sans:${bpSans.style.fontFamily};--bp-mono:${bpMono.style.fontFamily}}`;
