import type {Track} from './likes';
import {ShuffleManager} from '../utils/shuffle/ShuffleManager';
export interface EngineEvents{progress(pos:number,dur:number):void;playing():void;paused():void;finish():void;error():void}
export const LOAD_TIMEOUT_MS=10000;
export interface Engine{load(url:string):void;play():void;pause():void;seek(ms:number):void;setVolume(v0to100:number):void;on(h:EngineEvents):void}
export interface PlayerState{track:Track|null;playing:boolean;loading:boolean;positionMs:number;durationMs:number;volume:number;muted:boolean;message:string}
export const MSG={unplayable:"This track is visible in your likes but isn't currently playable.",failed:"We couldn't start playback for this track. Try again or choose another track.",stalled:"This track didn't start (it may be blocked or region-restricted). Try another track."};
export class PlayerController{
  state:PlayerState={track:null,playing:false,loading:false,positionMs:0,durationMs:0,volume:0.8,muted:false,message:''};
  private subs=new Set<(s:PlayerState)=>void>();
  private timer:ReturnType<typeof setTimeout>|null=null;private fails=0;
  private clearTimer(){if(this.timer){clearTimeout(this.timer);this.timer=null;}}
  constructor(private engine:Engine,private shuffle:ShuffleManager<Track>){
    engine.on({progress:(p,d)=>this.set({positionMs:p,durationMs:d||this.state.durationMs}),
      playing:()=>{this.clearTimer();this.fails=0;this.applyVolume();this.set({playing:true,loading:false,message:''});},paused:()=>this.set({playing:false}),
      finish:()=>{this.clearTimer();this.set({playing:false});this.next();},
      error:()=>this.fail(MSG.failed,this.auto)});
  }
  subscribe(f:(s:PlayerState)=>void){this.subs.add(f);return()=>{this.subs.delete(f);};}
  private set(p:Partial<PlayerState>){this.state={...this.state,...p};this.subs.forEach(f=>f(this.state));}
  private auto=false;
  /** The widget resets its volume when a new sound loads, so the chosen volume/mute is re-applied on every track start. */
  private applyVolume(){this.engine.setVolume(this.state.muted?0:this.state.volume*100);}
  /** Track failed to start: clear loading state; when auto-advancing (shuffle) skip to the next track, up to 5 in a row. */
  private fail(message:string,skip:boolean){this.clearTimer();this.set({playing:false,loading:false,message});
    if(skip&&++this.fails<=5)this.next();}
  playTrack(t:Track,auto=false):boolean{
    this.clearTimer();this.auto=auto;
    if(t.playable===false||!t.permalinkUrl){this.set({track:t,playing:false,loading:false,message:MSG.unplayable});return false;}
    this.set({track:t,loading:true,message:'',positionMs:0,durationMs:t.durationMs??0});
    this.engine.load(t.permalinkUrl);this.applyVolume();
    this.timer=setTimeout(()=>{if(this.state.loading&&this.state.track===t)this.fail(MSG.stalled,auto);},LOAD_TIMEOUT_MS);
    return true;
  }
  next(depth=0){const t=this.shuffle.next();if(t&&!this.playTrack(t,true)&&depth<10)this.next(depth+1);}
  previous(){const t=this.shuffle.previous();if(t)this.playTrack(t,false);}
  toggle(){this.state.playing?this.engine.pause():this.engine.play();}
  seek(ms:number){const v=Math.max(0,Math.min(ms,this.state.durationMs||ms));this.engine.seek(v);this.set({positionMs:v});}
  setVolume(v:number){v=Math.max(0,Math.min(1,v));this.set({volume:v,muted:false});this.applyVolume();}
  toggleMute(){this.set({muted:!this.state.muted});this.applyVolume();}
}
/** Adapter over SoundCloud's official Widget API (iframe stays in the DOM). */
export function createWidgetEngine(iframe:HTMLIFrameElement,SC:any):Engine{
  let w:any=null,h:EngineEvents|null=null,dur=0,vol=80;
  const bind=()=>{const E=SC.Widget.Events;
    // READY fires after every load(): re-apply volume and explicitly start playback in case auto_play was ignored.
    w.bind(E.READY,()=>{w.setVolume(vol);w.play();});
    w.bind(E.PLAY_PROGRESS,(e:any)=>h?.progress(e.currentPosition,dur));
    w.bind(E.PLAY,()=>{w.setVolume(vol);w.getDuration((d:number)=>{dur=d;});h?.playing();});
    w.bind(E.PAUSE,()=>h?.paused());w.bind(E.FINISH,()=>h?.finish());w.bind(E.ERROR,()=>h?.error());};
  return{on:x=>{h=x;},
    load:url=>{if(!w){iframe.src=`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true`;w=SC.Widget(iframe);bind();}
      else w.load(url,{auto_play:true,callback:()=>w.setVolume(vol)});},
    play:()=>w?.play(),pause:()=>w?.pause(),seek:ms=>w?.seekTo(ms),setVolume:v=>{vol=v;w?.setVolume(v);}};
}
