import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
const root=fileURLToPath(new URL(".",import.meta.url));
const config:NextConfig={turbopack:{root},outputFileTracingRoot:root,serverExternalPackages:["postgres"],outputFileTracingIncludes:{"/**":["./assets/fonts/**"]}};
export default config;
