"use client";

/** Deleting can't be undone, so the form asks first. */
export default function DeleteWebReview({ id, page }: { id: string; page?: number }) {
  return <form method="post" action="/api/funtimes/delete-web-review" onSubmit={e => { if (!window.confirm("Delete this web review from the site? This can't be undone.")) e.preventDefault(); }}>
    <input type="hidden" name="id" value={id} />
    {page && page > 1 ? <input type="hidden" name="page" value={page} /> : null}
    <button type="submit" className="danger-button">Delete review</button>
  </form>;
}
