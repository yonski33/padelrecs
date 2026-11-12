// The rounded sans of the light direction (owner, 2026-11-12): loaded only by the pages that use it.
import { Poppins } from "next/font/google";
export const lightFont = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
