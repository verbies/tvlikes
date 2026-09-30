import {describe,it,expect} from 'vitest';import {loadAllLikes} from './likes';
const page=(ids:number[],next:string|null)=>new Response(JSON.stringify({tracks:ids.map(id=>({id,title:'t',artistName:'a'})),next}));
describe('loadAllLikes',()=>{
  it('follows every page and dedupes',async()=>{const q=[page([1,2],'c1'),page([2,3],'c2'),page([4],null)];
    const r=await loadAllLikes(undefined,(async()=>q.shift()!) as any);expect(r.map(t=>t.id)).toEqual([1,2,3,4]);});
  it('retries on 429',async()=>{const q=[new Response('{}',{status:429}),page([1],null)];
    const r=await loadAllLikes(undefined,(async()=>q.shift()!) as any,async()=>{});expect(r).toHaveLength(1);});
  it('network failure',async()=>{await expect(loadAllLikes(undefined,(async()=>{throw 1}) as any)).rejects.toThrow('network');});
});
