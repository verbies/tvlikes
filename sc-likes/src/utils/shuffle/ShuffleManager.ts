export function fisherYates<T>(a:T[],rnd=Math.random):T[]{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
export class ShuffleManager<T>{
  private items:T[]=[];private deck:T[]=[];private pos=-1;
  constructor(items:T[]=[],private rnd:()=>number=Math.random){this.setItems(items);}
  setItems(items:T[]){this.items=[...items];this.reset();}
  reset(){this.deck=[];this.pos=-1;this.shuffle();}
  /** Builds a fresh deck of every item; avoids starting with the last-played item. */
  shuffle(){const last=this.current();const d=fisherYates(this.items,this.rnd);
    if(last!==null&&d.length>1&&d[0]===last){const j=1+Math.floor(this.rnd()*(d.length-1));[d[0],d[j]]=[d[j],d[0]];}
    this.deck=d;this.pos=-1;}
  current():T|null{return this.pos>=0?this.deck[this.pos]??null:null;}
  hasNext(){return this.items.length>0;}
  hasPrevious(){return this.pos>0;}
  next():T|null{if(!this.items.length)return null;
    if(this.pos+1>=this.deck.length)this.shuffle();
    return this.deck[++this.pos];}
  previous():T|null{if(this.pos<=0)return null;return this.deck[--this.pos];}
}
