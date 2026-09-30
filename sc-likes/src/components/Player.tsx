import {PlayerState} from '../services/playback';
const fmt=(ms:number)=>{const s=Math.floor(ms/1000);return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
export const Player=({s,c,embed,setEmbed}:{s:PlayerState;c:any;embed:boolean;setEmbed:(b:boolean)=>void})=>{
  const t=s.track;
  return <footer className="player" aria-label="Player">
    <div className="pl-in">
    <div className="now">{t?.artworkUrl?<img src={t.artworkUrl} alt=""/>:<span className="ph"/>}
      <div className="meta"><strong>{t?.title??'Nothing playing'}</strong><small>{t?.artistName}{s.loading?' · Loading track…':''}</small></div></div>
    <div className="mid"><div className="btns">
      <button aria-label="Previous" onClick={()=>c.previous()}>⏮</button>
      <button aria-label={s.playing?'Pause':'Play'} className="big" onClick={()=>c.toggle()}>{s.playing?'⏸':'▶'}</button>
      <button aria-label="Next" onClick={()=>c.next()}>⏭</button></div>
      <div className="seek"><small>{fmt(s.positionMs)}</small>
        <input aria-label="Seek" type="range" min={0} max={s.durationMs||1} step={document.documentElement.classList.contains('tv')?5000:1} value={Math.min(s.positionMs,s.durationMs||1)} onChange={e=>c.seek(+e.target.value)}/>
        <small>{fmt(s.durationMs)}</small></div></div>
    <div className="vol"><button aria-label={s.muted?'Unmute':'Mute'} onClick={()=>c.toggleMute()}>{s.muted||!s.volume?'🔇':'🔊'}</button>
      <input aria-label="Volume" type="range" min={0} max={1} step={document.documentElement.classList.contains('tv')?0.05:0.01} value={s.muted?0:s.volume} onChange={e=>c.setVolume(+e.target.value)}/>
      {t?.permalinkUrl&&<a href={t.permalinkUrl} target="_blank" rel="noreferrer">SoundCloud ↗</a>}
      <button aria-expanded={embed} onClick={()=>setEmbed(!embed)}>Embed</button></div></div>
    {s.message&&<p role="alert" className="msg">{s.message}</p>}
  </footer>;
};
