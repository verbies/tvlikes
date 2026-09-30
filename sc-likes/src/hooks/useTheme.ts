import {useEffect,useState} from 'react';
export const THEMES=['dark','midnight','dracula','light','contrast'] as const;export type Theme=typeof THEMES[number];
export const THEME_ACCENT:Record<Theme,string>={dark:'#ff5500',midnight:'#ea6191',dracula:'#bd93f9',light:'#ff5500',contrast:'#ffc400'};
export interface Look{theme:Theme;accent:string|null;radius:number;density:'comfortable'|'compact'}
export const DEFAULT_LOOK:Look={theme:'dark',accent:null,radius:14,density:'comfortable'};
const onAccent=(hex:string)=>{const n=parseInt(hex.slice(1),16),f=(c:number)=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4;};
  return .2126*f(n>>16)+.7152*f((n>>8)&255)+.0722*f(n&255)>.4?'#111':'#fff';};
export function useLook(){
  const [look,setLook]=useState<Look>(()=>{try{return{...DEFAULT_LOOK,...JSON.parse(localStorage.getItem('look')??'{}')};}catch{return DEFAULT_LOOK;}});
  useEffect(()=>{const r=document.documentElement;r.dataset.theme=look.theme;r.dataset.density=look.density;r.style.setProperty('--radius',look.radius+'px');
    if(look.accent){r.style.setProperty('--accent',look.accent);r.style.setProperty('--on-accent',onAccent(look.accent));}
    else{r.style.removeProperty('--accent');r.style.removeProperty('--on-accent');}
    try{localStorage.setItem('look',JSON.stringify(look));}catch{}},[look]);
  return[look,(p:Partial<Look>)=>setLook(l=>({...l,...p})),()=>setLook(DEFAULT_LOOK)] as const;
}
