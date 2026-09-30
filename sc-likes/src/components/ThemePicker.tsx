import {THEMES,Theme} from '../hooks/useTheme';
const L:Record<Theme,string>={dark:'Dark',midnight:'Midnight',dracula:'Dracula',light:'Light',contrast:'High Contrast'};
export function ThemePicker({value,onChange}:{value:Theme;onChange:(t:Theme)=>void}){
  return <div role="radiogroup" aria-label="Theme" className="seg">{THEMES.map(t=>
    <button key={t} role="radio" aria-checked={value===t} className={value===t?'sel':''} onClick={()=>onChange(t)}>{L[t]}</button>)}</div>;
}
