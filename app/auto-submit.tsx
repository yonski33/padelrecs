"use client";
/** A GET filter form that reloads as soon as a select changes, so there's no Filter button to press (a button stays for no-JS). */
export function AutoSubmitForm({ action, className, children }: { action: string; className?: string; children: React.ReactNode }) {
  return <form action={action} className={className} onChange={e => {
    // Skip empty fields so the address stays clean (/products?sort=positive, not ?brand=&shape=&sort=positive).
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget)) if (typeof v === "string" && v) q.set(k, v);
    window.location.href = q.size ? `${action}?${q}` : action;
  }}>{children}</form>;
}
