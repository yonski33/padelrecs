// The admin's section links, shared by the /funtimes tabs and the pages beside them (/funtimes/comments).
import { niche, isV2 } from "../../lib/niche";
import { threadSite } from "../../lib/thread/look";
import { accountSite, storiesSite } from "../../lib/thread/sites";
const w = niche.words;
export function AdminNav({current}:{current:"find"|"player"|"web"|"specs"|"expert"|"comments"|"traits"|"accounts"|"stories"}) {
 const at=(tab:typeof current)=>current===tab?"page" as const:undefined;
 return <nav className="admin-nav" aria-label="Admin sections"><a href="/funtimes?tab=find" aria-current={at("find")}>Find &amp; fix</a><a href="/funtimes" aria-current={at("player")}>{`${niche.people.One} submissions`}</a><a href="/funtimes?tab=web" aria-current={at("web")}>Web reviews</a><a href="/funtimes?tab=specs" aria-current={at("specs")}>{`${w.Many} & specs`}</a>{isV2 && <a href="/funtimes?tab=expert" aria-current={at("expert")}>Expert values</a>}{threadSite(niche.id) && <a href="/funtimes/comments" aria-current={at("comments")}>Latest comments</a>}{threadSite(niche.id) && <a href="/funtimes?tab=traits" aria-current={at("traits")}>Traits</a>}{accountSite(niche.id) && <a href="/funtimes?tab=accounts" aria-current={at("accounts")}>Accounts</a>}{storiesSite(niche.id) && <a href="/funtimes?tab=stories" aria-current={at("stories")}>Stories</a>}<form method="post" action="/auth/signout" style={{marginLeft:"auto"}}><button className="text-button">Sign out</button></form></nav>;
}
