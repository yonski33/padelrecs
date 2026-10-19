import { niche } from "../lib/niche";
export default function NotFound(){return <main className="narrow prose"><h1>Out of bounds</h1><p>{niche.copy.notFound}</p><p><a className="button" href="/rackets">{`Browse ${niche.words.many}`}</a></p></main>}
