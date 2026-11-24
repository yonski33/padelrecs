"use client";
// "Select all on this page" for the bulk bar: ticks or clears every row box that belongs to the bulk form. Without
// JavaScript the row boxes still work one by one.
export function SelectAll({ form }: { form: string }) {
  return <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
    <input type="checkbox" aria-label="Select all comments on this page" onChange={e => {
      for (const box of document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name=ids][form="${form}"]`)) box.checked = e.currentTarget.checked;
    }}/>All on this page</label>;
}
