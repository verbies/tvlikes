// Official SoundCloud API (docs: Authorization header is "OAuth <token>"; /resolve answers 302).
import {err,normalize} from './soundcloud.mjs';
export const API='https://api.soundcloud.com';
let cache={id:null,tok:null,exp:0};export const resetOfficial=()=>{cache={id:null,tok:null,exp:0};};
const fail=(code,where,status)=>err(code,{where,status});
export async function token(c){
  if(cache.id===c.clientId&&Date.now()<cache.exp)return cache.tok;
  let r;
  try{r=await fetch('https://secure.soundcloud.com/oauth/token',{method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json; charset=utf-8',
      Authorization:'Basic '+Buffer.from(`${c.clientId}:${c.clientSecret}`).toString('base64')},body:'grant_type=client_credentials'});}
  catch{throw fail('NETWORK','token');}
  if(r.status===429)throw err('RATE',{retryAfter:+r.headers.get('retry-after')||30,where:'token',status:429});
  if(!r.ok)throw fail([400,401,403].includes(r.status)?'AUTH':'API','token',r.status);
  const j=await r.json().catch(()=>null);if(!j?.access_token)throw fail('API','token',r.status);
  cache={id:c.clientId,tok:j.access_token,exp:Date.now()+((j.expires_in??3600)-60)*1000};return cache.tok;
}
export async function sc(url,c,where){
  let r;
  try{
    const headers={Authorization:`OAuth ${await token(c)}`,Accept:'application/json; charset=utf-8'};
    r=await fetch(url,{redirect:'manual',headers});
    for(let i=0;i<4&&r.status>=300&&r.status<400&&r.headers.get('location');i++) // follow redirects keeping the auth header (same host only)
      {const next=new URL(r.headers.get('location'),url);if(next.host!==new URL(API).host)break;r=await fetch(next,{redirect:'manual',headers});}
  }catch(e){if(e.code)throw e;throw fail('NETWORK',where);}
  if(r.status===429)throw err('RATE',{retryAfter:+r.headers.get('retry-after')||5,where,status:429});
  if(r.status===401||r.status===403){resetOfficial();throw fail('AUTH',where,r.status);}
  if(!r.ok)throw fail('API',where,r.status);
  return r.json();
}
export async function likesPage(profile,cursor,c){
  let url=cursor,tot=null;
  if(!url){
    const u=await sc(`${API}/resolve?url=${encodeURIComponent(profile)}`,c,'resolve');
    tot=u.likes_count??u.public_favorites_count??null;
    url=`${API}/users/${u.urn??u.id}/likes/tracks?limit=200&linked_partitioning=true&access=playable,preview,blocked`;
  }
  let j;
  const tries=[url,url.replace(/&access=[^&]*/,'')];
  if(!cursor&&url.includes('/soundcloud:users:'))tries.push(url.replace(/\/users\/soundcloud:users:/,'/users/'));  // numeric id if the URN form is refused
  for(let i=0;i<tries.length;i++){
    try{j=await sc(tries[i],c,'likes');break;}
    catch(e){if(cursor||![400,404].includes(e.status)||i===tries.length-1)throw e;}}
  const items=Array.isArray(j)?j:(j.collection??[]);
  return{total:typeof tot==='number'?tot:null,next:Array.isArray(j)?null:(j.next_href??null),tracks:items.filter(t=>t?.id).map(normalize)};
}
