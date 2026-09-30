// Shared, framework-free logic used by both the local Express server and Vercel functions.
import {getCreds,getProfile} from './env.mjs';
import {likesPage as anon} from './soundcloud.mjs';
import * as official from './official.mjs';
const profile=()=>getProfile().url;
const V2='https://api-v2.soundcloud.com/';
async function page(cursor,force){
  const creds=getCreds();let apiError=null;
  if(!cursor&&force==='api'&&!creds)throw Object.assign(new Error('config'),{code:'CONFIG'});
  const useApi=cursor?(cursor.startsWith(official.API+'/')&&!!creds):(force!=='anonymous'&&!!creds);
  if(useApi){
    if(!cursor&&force==='api')official.resetOfficial();
    try{return{...await official.likesPage(profile(),cursor,creds),source:'api'};}
    catch(e){if(cursor||e.code==='RATE'||force==='api')throw e;apiError=e.code??'API';console.error('Official API failed, using public route:',e.code,e.where,e.status);}
  }
  return{...await anon(profile(),cursor),source:'anonymous',apiError};
}
export async function likes(q={}){
  try{
    const cursor=q.cursor?String(q.cursor):undefined;
    if(cursor&&!cursor.startsWith(official.API+'/')&&!cursor.startsWith(V2))return{status:400,body:{code:'BAD_CURSOR'}};
    const force=['api','anonymous'].includes(String(q.mode))?String(q.mode):undefined;
    return{status:200,body:await page(cursor,force)};
  }catch(e){
    if(e.code==='RATE')return{status:429,headers:{'Retry-After':String(e.retryAfter??5)},body:{code:'RATE'}};
    console.error('Likes failed:',e.code??e.message,e.where,e.status);
    return{status:e.code==='AUTH'?401:e.code==='BLOCKED'?403:502,body:{code:e.code??'API',
      detail:e.where?`Official API failed at the "${e.where}" step${e.status?` (HTTP ${e.status})`:''}.`:undefined}};
  }
}
export const settings=()=>{const p=getProfile();return{status:200,body:{apiConfigured:!!getCreds(),profile:p.url,profileInvalid:p.invalid}};};
export async function diagnose(){
  const steps=[],add=(step,ok,detail)=>steps.push({step,ok,detail});const c=getCreds();
  if(!c)add('API keys',false,'No Client ID / secret found. Locally: fill credentials.txt. On Vercel: set SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET as environment variables, then redeploy.');
  else{add('API keys',true,`Client ID ending …${c.clientId.slice(-4)} found.`);
    try{official.resetOfficial();await official.token(c);add('Token request',true,'SoundCloud issued an access token.');
      try{const p=await official.likesPage(profile(),undefined,c);add('Likes (official API)',true,`${p.tracks.length} tracks on page 1${p.next?', more pages available':', no more pages'}${p.total?`; SoundCloud reports ${p.total} total`:''}.`);}
      catch(e){add('Likes (official API)',false,`Failed at "${e.where??'?'}" (${e.code}${e.status?`, HTTP ${e.status}`:''}).`);}
    }catch(e){add('Token request',false,`${e.code}${e.status?`, HTTP ${e.status}`:''}: ${e.code==='AUTH'?'SoundCloud rejected the Client ID / secret.':'could not get a token.'}`);}}
  try{const p=await anon(profile());add('Likes (public route)',true,`${p.tracks.length} tracks on page 1.`);}
  catch(e){add('Likes (public route)',false,`${e.code??'error'}${e.code==='BLOCKED'?': SoundCloud blocked anonymous access (hosting IPs are often blocked).':''}`);}
  return{status:200,body:{steps}};
}
