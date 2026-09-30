import {memo,useEffect,useMemo,useRef,useState} from 'react';
import {loadAllLikes,LikesError,Track} from './services/likes';
import {ShuffleManager} from './utils/shuffle/ShuffleManager';
import {PlayerController,PlayerState,createWidgetEngine} from './services/playback';
import {useLook} from './hooks/useTheme';import {Settings} from './components/Settings';
import {VirtualList} from './components/VirtualList';import {Player} from './components/Player';
declare const SC:any;
const MSG:Record<string,string>={network:"We couldn't connect to SoundCloud. Check your connection and try again.",
 rate:'SoundCloud is temporarily limiting requests. Please wait a moment and try again.',
 blocked:"SoundCloud isn't allowing anonymous access to these likes right now. This app does not try to work around that.",
 auth:'SoundCloud rejected the built-in API credentials. Check the values in .env.',
 config:'Server configuration problem.',api:"SoundCloud couldn't provide your likes right now."};
const fmt=(ms=0)=>{const s=Math.floor(ms/1000);return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
const Row=memo(({t,on,play}:{t:Track;on:boolean;play:(t:Track)=>void})=>
  <div className={'row'+(on?' on':'')}>
    <button className="play" aria-current={on} aria-label={`Play ${t.title} by ${t.artistName}`} onClick={()=>play(t)}>
      {t.artworkUrl?<img loading="lazy" src={t.artworkUrl} alt=""/>:<span className="ph"/>}
      <span className="tt">{on&&<span className="eq" aria-hidden="true"><i/><i/><i/></span>}{on?'Now playing · ':''}{t.title}<br/>
        <small>{t.artistName}{t.access==='preview'?' · preview only':''}{t.playable===false?' · not playable':''}</small></span></button>
    <small>{fmt(t.durationMs)}</small><span className="heart" role="img" aria-label="Liked">♥</span>
    <a href={t.permalinkUrl} target="_blank" rel="noreferrer" aria-label={`Open ${t.title} on SoundCloud`}>SoundCloud ↗</a></div>);
export default function App(){
  const [look,setLook,resetLook]=useLook();const [open,setOpen]=useState(false);const [server,setServer]=useState<{mode:string;apiConfigured?:boolean;apiError?:string|null;profile?:string;profileInvalid?:string|null}|null>(null);
  const [tracks,setTracks]=useState<Track[]>([]);const [count,setCount]=useState(0);const [total,setTotal]=useState<number>();
  const [status,setStatus]=useState<'loading'|'done'|'error'>('loading');const [errKind,setErrKind]=useState('api');const [q,setQ]=useState('');
  const [pending,setPending]=useState(false);const [errDetail,setErrDetail]=useState('');const [diag,setDiag]=useState<{step:string;ok:boolean;detail:string}[]|null>(null);
  const shuffle=useRef(new ShuffleManager<Track>());const frame=useRef<HTMLIFrameElement>(null);
  const [embed,setEmbed]=useState(false);const [scFail,setScFail]=useState(false);const [ctl,setCtl]=useState<PlayerController|null>(null);const [ps,setPs]=useState<PlayerState|null>(null);
  const loadServer=()=>fetch('/api/settings').then(r=>r.json()).then(j=>setServer(s=>({mode:s?.mode??'anonymous',apiError:s?.apiError,apiConfigured:j.apiConfigured,profile:j.profile,profileInvalid:j.profileInvalid}))).catch(()=>{});
  const runDiag=()=>{setDiag([{step:'Running checks…',ok:true,detail:''}]);fetch('/api/diagnose').then(r=>r.json()).then(j=>setDiag(j.steps)).catch(()=>setDiag([{step:'Server',ok:false,detail:"The app's /api routes aren't answering. Locally run npm run dev; on Vercel make sure the api/ folder was deployed."}]));};
  const load=(mode?:'api'|'anonymous')=>{setDiag(null);setStatus('loading');setCount(0);setTotal(undefined);loadServer();
    loadAllLikes((n,t,m)=>{setCount(n);setTotal(t);if(m?.source)setServer(s=>({...(s??{}),mode:m.source==='api'?'api':'anonymous',apiError:m.apiError??null}));},undefined,undefined,mode).then(t=>{setTracks(t);shuffle.current.setItems(t.filter(x=>x.playable!==false));setStatus('done');loadServer();})
    .catch(e=>{setErrKind(e instanceof LikesError?e.kind:'api');setErrDetail(e instanceof LikesError?e.detail??'':'');setStatus('error');loadServer();});};
  useEffect(()=>{load();const s=document.createElement('script');s.src='https://w.soundcloud.com/player/api.js';
    s.onload=()=>{const c=new PlayerController(createWidgetEngine(frame.current!,SC),shuffle.current);c.subscribe(setPs);setCtl(c);setPs(c.state);};
    s.onerror=()=>setScFail(true);
    document.body.append(s);},[]);
  useEffect(()=>{if(pending&&status==='done'&&ctl){setPending(false);ctl.next();}if(pending&&status==='error')setPending(false);},[pending,status,ctl]);
  useEffect(()=>{(window as any).__tv=(a:string)=>{ // called by the Android TV shell for remote media keys and Back
      if(a==='toggle')ctl?.toggle();else if(a==='next')ctl?.next();else if(a==='previous')ctl?.previous();
      else if(a==='back'){if(open){setOpen(false);return true;}return false;}
      return true;};},[ctl,open]);
  useEffect(()=>{if(status==='done'&&ctl&&document.documentElement.classList.contains('tv')&&(!document.activeElement||document.activeElement===document.body))document.querySelector<HTMLElement>('.btn')?.focus();},[status,ctl]);
  const onShuffle=()=>{if(status==='done')ctl?.next();else if(status==='loading')setPending(true);};
  const play=useMemo(()=>(t:Track)=>ctl?.playTrack(t),[ctl]);
  const list=useMemo(()=>{const n=q.toLowerCase();return tracks.filter(t=>(t.title+' '+t.artistName).toLowerCase().includes(n));},[tracks,q]);
  const cur=ps?.track;
  return <><div className="wrap">
   <header className="top"><div className="brand"><span className="dot"/>My Likes</div>
     <div><span className="chip">{server?.mode==='api'?'Official API':server?.apiError?`Public route (API failed: ${server.apiError})`:'Anonymous'}</span>{server?.apiConfigured&&server.mode!=='api'&&<button disabled={status==='loading'} onClick={()=>load('api')}>↻ Retry official API</button>} <button aria-label="Open appearance settings" onClick={()=>setOpen(true)}>🎨 Appearance</button></div></header>
   <section className="hero0"><h1>Your liked music</h1>
     <p>{status==='done'?`${tracks.length.toLocaleString()} liked tracks loaded`:server?.profile?`from ${server.profile.replace(/^https?:\/\//,'')}/likes`:'from SoundCloud'}
       {status==='done'&&total&&total>tracks.length?` · SoundCloud reports ${total.toLocaleString()}; the rest aren't available to this app`:''}</p>
     {server?.profileInvalid&&<p role="alert" className="msg">The PROFILE_URL in credentials.txt ("{server.profileInvalid}") isn't a valid soundcloud.com profile, so the default is being used.</p>}
     <button className="btn" disabled={!ctl||status==='error'||(status==='done'&&tracks.length===0)} onClick={onShuffle}>🎵 Shuffle All Likes</button>
     {pending&&<p role="status">Preparing your complete shuffle…</p>}</section>
   {cur&&<section className="hero" aria-label="Currently playing">
     {cur.artworkUrl?<img src={cur.artworkUrl.replace('t300x300','t500x500')} alt=""/>:<span className="ph big"/>}
     <div><small>Currently playing</small><h2>{cur.title}</h2><p>{cur.artistName} · {fmt(cur.durationMs)}</p></div></section>}
   <section className="list">
   {status==='loading'&&<><p role="status">{count===0?'Loading your SoundCloud likes…':'Loading more liked tracks…'}<br/>
      {total?`${count.toLocaleString()} / ${total.toLocaleString()} tracks`:`${count.toLocaleString()} tracks loaded`}</p>
      {[0,1,2,3,4,5].map(i=><div key={i} style={{height:64}}><div className="row skel" aria-hidden="true"><span className="ph"/><span className="bar"/></div></div>)}</>}
   {status==='error'&&<div role="alert"><h2>We couldn't load your liked tracks.</h2><p>{MSG[errKind]}</p>{errDetail&&<p><small>{errDetail}</small></p>}
      <button onClick={()=>load()}>Try Again</button> {server?.apiConfigured&&<button onClick={()=>load('api')}>↻ Retry official API</button>} <button onClick={()=>load('anonymous')}>Use public route</button> <button onClick={runDiag}>Run diagnostics</button>
      {diag&&<ul aria-live="polite">{diag.map((d,i)=><li key={i}>{d.ok?'✅':'❌'} <strong>{d.step}</strong> {d.detail}</li>)}</ul>}</div>}
   {status==='done'&&(tracks.length===0?<div role="status"><h2>No liked tracks found</h2><p>There aren't any liked tracks available from this SoundCloud collection yet.</p></div>:<>
     <input className="search" type="search" aria-label="Search your likes" placeholder="Search my likes…" value={q} onChange={e=>setQ(e.target.value)}/>
     {list.length===0?<p>No liked tracks match “{q}”.</p>:<VirtualList items={list} rowHeight={look.density==='compact'?54:66} render={t=><Row t={t} on={t.id===cur?.id} play={play}/>}/>}</>)}
   </section></div>
  <Settings open={open} onClose={()=>setOpen(false)} look={look} setLook={setLook} reset={resetLook}/>
  {scFail&&<p role="alert" className="msg" style={{position:'fixed',bottom:12,left:12}}>Couldn't load SoundCloud's player script (an ad blocker may be blocking w.soundcloud.com).</p>}
  {ps&&ctl&&<Player s={ps} c={ctl} embed={embed} setEmbed={setEmbed}/>}
  <iframe ref={frame} tabIndex={-1} title="SoundCloud player" allow="autoplay"
    style={embed?{position:'fixed',left:12,right:12,bottom:96,maxWidth:980,margin:'auto',height:120,border:0,zIndex:20}
      :{position:'fixed',right:0,bottom:0,width:300,height:120,border:0,opacity:0.01,pointerEvents:'none',zIndex:-1}}/></>;
}
