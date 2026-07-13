import { passesQualityFilter } from '../quality';

describe('passesQualityFilter', () => {
  it('passes a page with substantial visible text', () => {
    const html = `<html><body><p>${'This page has plenty of real content. '.repeat(5)}</p></body></html>`;
    expect(passesQualityFilter(html)).toBe(true);
  });

  it('fails a near-empty page', () => {
    const html = '<html><body><p>Hi</p></body></html>';
    expect(passesQualityFilter(html)).toBe(false);
  });

  it('respects a custom minLength', () => {
    const html = '<html><body><p>Short but ok</p></body></html>';
    expect(passesQualityFilter(html, 5)).toBe(true);
  });
});
