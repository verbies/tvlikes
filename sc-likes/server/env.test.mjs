import {describe,it,expect} from 'vitest';import {normalizeProfile as n} from './env.mjs';
describe('normalizeProfile',()=>{
  it('accepts links, bare host paths and usernames',()=>{
    expect(n('https://soundcloud.com/vetb/likes')).toBe('https://soundcloud.com/vetb');
    expect(n('soundcloud.com/some-one_1/')).toBe('https://soundcloud.com/some-one_1');
    expect(n('justname')).toBe('https://soundcloud.com/justname');});
  it('rejects other hosts and empty values',()=>{
    for(const v of ['https://evil.com/vetb','https://soundcloud.com.evil.com/x','','https://soundcloud.com/'])expect(n(v)).toBeNull();});
});
