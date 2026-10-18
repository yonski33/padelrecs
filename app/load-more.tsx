"use client";
import Link, { useLinkStatus } from "next/link";

function Label() {
  const { pending } = useLinkStatus();
  return <>{pending ? "Loading…" : "Load more reviews ↓"}</>;
}

// A real link (crawlable, works without JavaScript); with JavaScript it swaps in the longer list without a reload or a jump.
export function LoadMore({ href }: { href: string }) {
  return <p className="load-more"><Link className="button ghost" href={href} scroll={false} replace prefetch={false}><Label/></Link></p>;
}
