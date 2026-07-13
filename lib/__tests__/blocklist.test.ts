import { isBlocked } from '../blocklist';

describe('isBlocked', () => {
  const blockedDomains = ['famous-platform.com'];
  const blockedUrlSubstrings = ['/viral-page/'];

  it('blocks an exact domain match', () => {
    expect(isBlocked('https://famous-platform.com/x', 'famous-platform.com', blockedDomains, blockedUrlSubstrings)).toBe(true);
  });

  it('blocks a URL containing a blocked substring', () => {
    expect(isBlocked('https://tripod.com/viral-page/index.html', 'tripod.com', blockedDomains, blockedUrlSubstrings)).toBe(true);
  });

  it('allows an unrelated domain and URL', () => {
    expect(isBlocked('https://tripod.com/~reeftankdave/', 'tripod.com', blockedDomains, blockedUrlSubstrings)).toBe(false);
  });

  it('defaults to the exported starter lists when no arguments given', () => {
    expect(isBlocked('https://tripod.com/~someone/', 'tripod.com')).toBe(false);
  });
});
