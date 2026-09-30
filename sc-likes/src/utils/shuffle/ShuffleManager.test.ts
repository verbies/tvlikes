import {describe,it,expect} from 'vitest';import {ShuffleManager} from './ShuffleManager';
const seq=(n:number)=>Array.from({length:n},(_,i)=>i);
describe('ShuffleManager',()=>{
  it('empty',()=>{const m=new ShuffleManager<number>([]);expect(m.next()).toBeNull();expect(m.previous()).toBeNull();});
  it('single',()=>{const m=new ShuffleManager([7]);expect([m.next(),m.next()]).toEqual([7,7]);});
  it('deck has every track once',()=>{const m=new ShuffleManager(seq(200));const s=Array.from({length:200},()=>m.next());expect(new Set(s).size).toBe(200);});
  it('rebuilds after exhaustion without immediate repeat',()=>{for(let k=0;k<50;k++){const m=new ShuffleManager(seq(5));let last=-1;for(let i=0;i<5;i++)last=m.next()!;expect(m.next()).not.toBe(last);}});
  it('previous walks history',()=>{const m=new ShuffleManager(seq(5));const a=m.next(),b=m.next();expect(m.previous()).toBe(a);expect(m.next()).toBe(b);});
});
