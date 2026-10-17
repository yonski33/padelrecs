"use client";
export default function Error({reset}:{reset:()=>void}) {return <main className="narrow"><h1>Could not load this page</h1><p>Please try again. If this is a new deployment, check the database configuration and migrations.</p><button onClick={reset}>Try again</button></main>;}
