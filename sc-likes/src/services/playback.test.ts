import {describe,it,expect,vi,afterEach} from 'vitest';
import {PlayerController,Engine,EngineEvents,MSG,LOAD_TIMEOUT_MS} from './playback';import {ShuffleManager} from '../utils/shuffle/ShuffleManager';
const T=(id:number,p=true)=>({id,title:'t'+id,artistName:'a',permalinkUrl:'https://x/'+id,playable:p,durationMs:1000});
function setup(tracks=[T(1),T(2),T(3)]){let ev!:EngineEvents;
  const e:Engine={load:vi.fn(),play:vi.fn(),pause:vi.fn(),seek:vi.fn(),setVolume:vi.fn(),on:h=>{ev=h;}};
  const c=new PlayerController(e,new ShuffleManager(tracks));return{c,e,ev:()=>ev};}
describe('PlayerController',()=>{
  it('plays a track',()=>{const{c,e}=setup();c.playTrack(T(1));expect(e.load).toHaveBeenCalledWith('https://x/1');expect(c.state.loading).toBe(true);});
  it('play/pause toggles',()=>{const{c,e,ev}=setup();c.playTrack(T(1));ev().playing();c.toggle();expect(e.pause).toHaveBeenCalled();ev().paused();c.toggle();expect(e.play).toHaveBeenCalled();});
  it('next and previous use shuffle history',()=>{const{c}=setup();c.next();const a=c.state.track;c.next();const b=c.state.track;c.previous();expect(c.state.track).toBe(a);expect(b).not.toBe(a);});
  it('finish advances',()=>{const{c,ev}=setup();c.next();const a=c.state.track;ev().finish();expect(c.state.track).not.toBe(a);});
  it('seek clamps',()=>{const{c,e}=setup();c.playTrack(T(1));c.seek(5000);expect(e.seek).toHaveBeenCalledWith(1000);});
  it('volume and mute',()=>{const{c,e}=setup();c.setVolume(0.5);expect(e.setVolume).toHaveBeenLastCalledWith(50);c.toggleMute();expect(e.setVolume).toHaveBeenLastCalledWith(0);c.toggleMute();expect(e.setVolume).toHaveBeenLastCalledWith(50);});
  it('playback failure',()=>{const{c,ev}=setup();c.playTrack(T(1));ev().error();expect(c.state.message).toBe(MSG.failed);});
  it('unavailable track does not crash and is not loaded',()=>{const{c,e}=setup();expect(c.playTrack(T(9,false))).toBe(false);expect(e.load).not.toHaveBeenCalled();expect(c.state.message).toBe(MSG.unplayable);});
  it('shuffle skips unplayable tracks',()=>{const{c}=setup([T(1,false),T(2,false),T(3)]);c.next();expect(c.state.track?.id).toBe(3);});
  describe('stalls',()=>{
    afterEach(()=>{vi.useRealTimers();});
    it('manual play that never starts stops loading and reports it',()=>{vi.useFakeTimers();const{c}=setup();c.playTrack(T(1));
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS+1);expect(c.state.loading).toBe(false);expect(c.state.message).toBe(MSG.stalled);});
    it('shuffle auto-skips a track that never starts',()=>{vi.useFakeTimers();const{c}=setup();c.next();const a=c.state.track;
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS+1);expect(c.state.track).not.toBe(a);expect(c.state.loading).toBe(true);});
    it('starting playback cancels the stall timer',()=>{vi.useFakeTimers();const{c,ev}=setup();c.playTrack(T(1));ev().playing();
      vi.advanceTimersByTime(LOAD_TIMEOUT_MS+1);expect(c.state.playing).toBe(true);expect(c.state.message).toBe('');});
  });
  it('keeps the chosen volume when shuffling to the next track',()=>{const{c,e,ev}=setup();c.setVolume(0.3);
    c.next();ev().playing();expect(e.setVolume).toHaveBeenLastCalledWith(30);
    ev().finish();ev().playing();expect(e.setVolume).toHaveBeenLastCalledWith(30);expect(c.state.volume).toBe(0.3);});
  it('keeps mute across tracks',()=>{const{c,e,ev}=setup();c.setVolume(0.6);c.toggleMute();c.next();ev().playing();
    expect(e.setVolume).toHaveBeenLastCalledWith(0);c.toggleMute();expect(e.setVolume).toHaveBeenLastCalledWith(60);});
});
