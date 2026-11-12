"use client";
import {useEffect,useState} from "react";

// One check per page view, shared by every review card. Only a browser holding a Supabase session cookie asks the server,
// so ordinary visitors make no extra request.
let adminCheck:Promise<boolean>|null=null;
function isAdmin(){
 if(!/(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie))return Promise.resolve(false);
 adminCheck??=fetch("/api/funtimes/me",{cache:"no-store"}).then(r=>r.ok?r.json():{admin:false}).then(d=>!!d.admin).catch(()=>false);
 return adminCheck;
}
/** An "Edit" link on a public review card, shown only to the signed-in owner. Opens the review in the admin editor. */
export default function AdminEdit({type,id}:{type:"web"|"player";id:string}){
 const [show,setShow]=useState(false);
 useEffect(()=>{let live=true;isAdmin().then(a=>{if(live)setShow(a);});return()=>{live=false;};},[]);
 return show?<a className="admin-edit" href={`/funtimes/edit-review?type=${type}&id=${encodeURIComponent(id)}`}>Edit</a>:null;
}
