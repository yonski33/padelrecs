// Quick-take "design language v2" fonts (owner 2026-11-15, Claude Design reference): Archivo headings, Atkinson Hyperlegible
// body, JetBrains Mono for the small print. Loaded only by quick-take pages.
import { Archivo, Atkinson_Hyperlegible, JetBrains_Mono } from "next/font/google";
export const qtDisplay = Archivo({ subsets: ["latin"], weight: ["500", "700", "800"], display: "swap", variable: "--qt-display" });
export const qtBody = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--qt-body" });
export const qtMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], display: "swap", variable: "--qt-mono" });
export const qtFontVars = `${qtDisplay.variable} ${qtBody.variable} ${qtMono.variable}`;
