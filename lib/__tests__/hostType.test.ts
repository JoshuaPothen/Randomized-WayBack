import { classifyHostType } from '../hostType';

describe('classifyHostType', () => {
  it('classifies webrings', () => {
    expect(classifyHostType('Join our lighthouse webring today')).toBe('Webring');
  });

  it('classifies fan archives', () => {
    expect(classifyHostType('The Unofficial Xena Fanfic Vault')).toBe('Fan Archive');
  });

  it('classifies hobby clubs', () => {
    expect(classifyHostType('Doll Collectors United hobby club')).toBe('Hobby Club');
  });

  it('falls back to Personal Homepage', () => {
    expect(classifyHostType("Dave's 20-Gallon Reef Tank Journal")).toBe('Personal Homepage');
  });
});
