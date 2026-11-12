"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";

/** A GET filter form that applies itself as soon as a field changes, so there's no Filter button to press (a button
 *  stays for no-JS). The page updates in place, without a full reload, so the scroll position and the focus stay
 *  where they are; typed text waits for a short pause so every key doesn't fetch a page (owner, 2026-11-13). */
export function AutoSubmitForm({ action, className, children }: { action: string; className?: string; children: React.ReactNode }) {
  const router = useRouter(), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apply = (form: HTMLFormElement) => {
    // Skip empty fields so the address stays clean (/products?sort=positive, not ?brand=&shape=&sort=positive).
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (typeof v === "string" && v) q.append(k, v); // append: checkbox groups send several values
    router.replace(q.size ? `${action}?${q}` : action, { scroll: false });
  };
  return <form action={action} className={className}
    onChange={e => {
      const form = e.currentTarget, field = e.target as unknown as HTMLInputElement, typing = field.type === "search" || field.type === "text";
      if (timer.current) clearTimeout(timer.current);
      if (typing) timer.current = setTimeout(() => apply(form), 300); else apply(form);
    }}
    onSubmit={e => { e.preventDefault(); if (timer.current) clearTimeout(timer.current); apply(e.currentTarget); }}>{children}</form>;
}
