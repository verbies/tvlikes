// Anonymous, read-only access to the PUBLIC likes of one profile. No credentials, no sign-in.
// UNOFFICIAL: reads the same public page/data a browser loads. Fragile; may conflict with SoundCloud's terms.
// If SoundCloud blocks it (403/captcha/anti-bot) we stop and report; we never try to get around it.
const UA='PersonalLikesPlayer/1.0 (personal, read-only)';
const V2='https://api-v2.soundcloud.com';
export const err=(code,extra={})=>Object.assign(new Error(code),{code,...extra});
export const parseHydration=html=>{const m=/window\.__sc_hydration\s*=\s*(\[[\s\S]*?\]);\s*<\/script>/.exec(html);if(!m)return null;try{return JSON.parse(m[1]);}catch{return null;}};
export const findUser=h=>h?.find?.(x=>x.hydratable==='user')?.data??null;
export const findClientId=js=>/client_id\s*[:=]\s*"([A-Za-z0-9]{32})"/.exec(js)?.[1]??null;
export const scriptUrls=html=>[...html.matchAll(/<script[^>]+src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g)].map(m=>m[1]);
export function normalize(t){
  const blocked=t.access==='blocked'||t.policy==='BLOCK';
  return{id:t.id,title:t.title,artistName:t.user?.username??'Unknown',artworkUrl:(t.artwork_url??t.user?.avatar_url)?.replace('-large','-t300x300'),
    durationMs:t.duration,permalinkUrl:t.permalink_url,access:t.access,playable:!blocked&&t.streamable!==false};
}
const get=url=>fetch(url,{headers:{'User-Agent':UA,Accept:'*/*'}});
const ctxs=new Map(); // per profile, so changing the profile URL never serves a stale user id
export async function context(profile){
  if(ctxs.has(profile))return ctxs.get(profile);
  const r=await get(profile.replace(/\/$/,'')+'/likes');
  if(r.status===429)throw err('RATE',{retryAfter:+r.headers.get('retry-after')||10});
  if(r.status===404)throw err('NOTFOUND');
  const html=await r.text();
  if(!r.ok||/captcha|datadome/i.test(html.slice(0,4000)))throw err('BLOCKED');
  const user=findUser(parseHydration(html));if(!user?.id)throw err('UNSUPPORTED');
  let clientId=null;
  for(const u of scriptUrls(html).reverse()){clientId=findClientId(await(await get(u)).text());if(clientId)break;}
  if(!clientId)throw err('UNSUPPORTED');
  const ctx={user,clientId};ctxs.set(profile,ctx);return ctx;
}
export async function api(url,profile,retry=true){
  const c=await context(profile);const u=new URL(url);u.searchParams.set('client_id',c.clientId);
  const r=await get(u);
  if(r.status===429)throw err('RATE',{retryAfter:+r.headers.get('retry-after')||10});
  if(r.status===401||r.status===403){ctxs.delete(profile);if(retry)return api(url,profile,false);throw err('BLOCKED');}
  if(!r.ok)throw err('API');return r.json();
}
export async function likesPage(profile,cursor){
  const c=await context(profile);
  const url=cursor??`${V2}/users/${c.user.id}/track_likes?limit=200`;
  const j=await api(url,profile);
  const items=(j.collection??[]).map(x=>x.track).filter(t=>t?.id);
  const bare=items.filter(t=>!t.title).map(t=>t.id); // some entries only carry an id
  const full=new Map();
  for(let i=0;i<bare.length;i+=50){
    const d=await api(`${V2}/tracks?ids=${bare.slice(i,i+50).join(',')}`,profile);
    for(const t of d)full.set(t.id,t);
  }
  const tracks=items.map(t=>t.title?t:full.get(t.id)).filter(Boolean).map(normalize);
  return{total:cursor?null:(typeof c.user.likes_count==='number'?c.user.likes_count:null),next:j.next_href??null,tracks};
}
