import {describe,it,expect} from 'vitest';import {parseHydration,findUser,findClientId,scriptUrls,normalize} from './soundcloud.mjs';
describe('soundcloud parsing',()=>{
  const html='<script src="https://a-v2.sndcdn.com/assets/a.js"></script><script>window.__sc_hydration = [{"hydratable":"user","data":{"id":5,"likes_count":3}}];</script>';
  it('finds user',()=>expect(findUser(parseHydration(html)).id).toBe(5));
  it('finds script urls and client id',()=>{expect(scriptUrls(html)).toHaveLength(1);expect(findClientId('x={client_id:"'+'a'.repeat(32)+'"}')).toBe('a'.repeat(32));});
  it('missing data is null',()=>expect(findUser(parseHydration('<html/>'))).toBeNull());
  it('blocked tracks are not playable',()=>expect(normalize({id:1,title:'t',access:'blocked'}).playable).toBe(false));
});
