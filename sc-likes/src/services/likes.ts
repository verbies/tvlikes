export interface Track{id:number;title:string;artistName:string;artworkUrl?:string;durationMs?:number;permalinkUrl?:string;access?:'playable'|'preview'|'blocked';playable?:boolean}
export class LikesError extends Error{constructor(public kind:'network'|'rate'|'blocked'|'auth'|'config'|'api',public detail?:string){super(kind);}}
const sleep=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));
export async function loadAllLikes(onProgress?:(n:number,total?:number,meta?:{source?:string;apiError?:string|null})=>void,f:typeof fetch=fetch,wait:(ms:number)=>Promise<void>=sleep,mode?:'api'|'anonymous'):Promise<Track[]>{
  const map=new Map<number,Track>();let cursor:string|null=null,retries=0,total:number|undefined;
  do{
    let r:Response;
    try{r=await f('/api/likes'+(cursor?`?cursor=${encodeURIComponent(cursor)}`:mode?`?mode=${mode}`:''));}catch{throw new LikesError('network');}
    if(r.status===429){if(++retries>5)throw new LikesError('rate');await wait((+(r.headers.get('retry-after')??2))*1000*retries);continue;}
    if(!r.ok){const b=await r.json().catch(()=>({}));const c=b.code;throw new LikesError(c==='BLOCKED'?'blocked':c==='AUTH'?'auth':c==='CONFIG'?'config':'api',b.detail);}
    retries=0;const j=await r.json();
    if(typeof j.total==='number')total=j.total;
    for(const t of j.tracks as Track[])map.set(t.id,t);
    onProgress?.(map.size,total,{source:j.source,apiError:j.apiError});cursor=j.next; // follows next_href until absent
  }while(cursor);
  return [...map.values()];
}
