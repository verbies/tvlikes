import {useEffect} from 'react';import {ThemePicker} from './ThemePicker';import {Look,THEME_ACCENT} from '../hooks/useTheme';
const SWATCHES=['#ff5500','#ff3d81','#a259ff','#3d8bff','#19c3a6','#7ed321','#ffc400'];
export function Settings({open,onClose,look,setLook,reset}:{open:boolean;onClose:()=>void;look:Look;setLook:(p:Partial<Look>)=>void;reset:()=>void}){
  useEffect(()=>{if(!open)return;const k=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();addEventListener('keydown',k);return()=>removeEventListener('keydown',k);},[open,onClose]);
  if(!open)return null;
  return <div className="scrim" onClick={onClose}><aside className="drawer" role="dialog" aria-modal="true" aria-label="Appearance" onClick={e=>e.stopPropagation()}>
    <div className="dhead"><h2>Appearance</h2><button aria-label="Close" onClick={onClose}>✕</button></div>
    <section><h3>Theme</h3><ThemePicker value={look.theme} onChange={theme=>setLook({theme,accent:null})}/>
      <p className="lbl">Accent color</p>
      <div className="sw">{SWATCHES.map(c=><button key={c} aria-label={`Accent ${c}`} aria-pressed={look.accent===c} className="swatch" style={{background:c}} onClick={()=>setLook({accent:c})}/>)}
        <input type="color" aria-label="Custom accent color" value={look.accent??THEME_ACCENT[look.theme]} onChange={e=>setLook({accent:e.target.value})}/>
        <button onClick={()=>setLook({accent:null})}>Theme default</button></div>
      <label className="lbl">Corner roundness ({look.radius}px)<input type="range" min={2} max={28} value={look.radius} onChange={e=>setLook({radius:+e.target.value})}/></label>
      <p className="lbl">Density</p>
      <div className="seg">{(['comfortable','compact'] as const).map(d=><button key={d} className={look.density===d?'sel':''} aria-pressed={look.density===d} onClick={()=>setLook({density:d})}>{d[0].toUpperCase()+d.slice(1)}</button>)}</div>
      <p><button onClick={reset}>Reset appearance</button></p></section></aside></div>;
}
