import fs from 'node:fs';
const read=n=>{try{return fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');}catch{return'';}};
const parse=t=>{const o={};for(const l of t.split(/\r?\n/)){if(/^\s*#/.test(l))continue;
  const m=/^\s*([A-Za-z_]+)\s*[=:]\s*(.*?)\s*$/.exec(l);if(m)o[m[1].toUpperCase()]=m[2].replace(/^["']|["']$/g,'');}return o;};
for(const[k,v]of Object.entries(parse(read('.env'))))if(!(k in process.env))process.env[k]=v; // PORT, SOUNDCLOUD_PROFILE_URL
/** Read fresh each call so editing credentials.txt needs no restart. */
export function getCreds(){
  const f={...parse(read('.env')),...parse(read('credentials.txt'))};
  const clientId=f.CLIENT_ID||f.SOUNDCLOUD_CLIENT_ID||process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret=f.CLIENT_SECRET||f.SOUNDCLOUD_CLIENT_SECRET||process.env.SOUNDCLOUD_CLIENT_SECRET;
  return clientId&&clientSecret?{clientId,clientSecret}:null;
}

export const DEFAULT_PROFILE='https://soundcloud.com/vetb';
/** Accepts "https://soundcloud.com/name/likes", "soundcloud.com/name", or just "name". Returns https://soundcloud.com/<name> or null. */
export function normalizeProfile(v){
  let x=String(v??'').trim();if(!x)return null;
  if(!/[\/.]/.test(x))x='soundcloud.com/'+x;
  if(!/^https?:\/\//i.test(x))x='https://'+x;
  let u;try{u=new URL(x);}catch{return null;}
  if(!/^(www\.|m\.)?soundcloud\.com$/i.test(u.hostname))return null;
  const name=u.pathname.split('/').filter(Boolean)[0];
  return name&&/^[\w.-]+$/.test(name)?'https://soundcloud.com/'+name:null;
}
/** Read fresh each call so editing credentials.txt needs no restart. Priority: credentials.txt > .env / environment > default. */
export function getProfile(){
  const f={...parse(read('.env')),...parse(read('credentials.txt'))};
  const raw=f.PROFILE_URL||f.SOUNDCLOUD_PROFILE_URL||process.env.SOUNDCLOUD_PROFILE_URL;
  if(!raw)return{url:DEFAULT_PROFILE,invalid:null};
  const url=normalizeProfile(raw);
  return url?{url,invalid:null}:{url:DEFAULT_PROFILE,invalid:raw};
}
