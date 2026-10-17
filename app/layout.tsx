export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "./site-header";
import { isAdmin } from "./admin/auth";
export const metadata: Metadata = { title: {default: "PadelRecs — racket database", template: "%s · PadelRecs"}, description: "Padel racket specifications, player reviews, and external review sources." };
export default async function Layout({children}: {children: React.ReactNode}) { const admin = await isAdmin(); return <html lang="en"><body><div className="site"><SiteHeader/>{children}<footer><a className="footer-logo" href="/">padelrecs</a><a href="/about">About this project</a>{admin && <><a href="/admin">Review admin</a><form method="post" action="/auth/signout"><button className="text-button">Sign out</button></form></>}</footer></div></body></html> }
