import { assembleEdition } from '../assemble';
import type { CdxRecord } from '../types';

function makeRecord(id: string, timestamp = '19990101000000'): CdxRecord {
  return {
    urlkey: `com,example)/${id}`,
    timestamp,
    original: `http://example.com/${id}`,
    mimetype: 'text/html',
    statuscode: '200',
    digest: 'abc',
    length: '100',
  };
}

function htmlFor(id: string, text: string) {
  return `<html><head><title>${id}</title></head><body><p>${text}</p></body></html>`;
}

describe('assembleEdition', () => {
  it('builds items with tiers, dropping blocked/low-quality/failed candidates', async () => {
    let call = 0;
    const domains = ['a.com', 'b.com', 'c.com', 'd.com'];

    const fetchCapture = jest.fn(async (domain: string) => {
      call += 1;
      if (domain === 'a.com') return null; // simulate a failed CDX lookup
      return makeRecord(`${domain}-${call}`);
    });

    const fetchCaptureHtml = jest.fn(async (record: CdxRecord) => {
      if (record.original.includes('b.com')) return htmlFor('short', 'too short'); // fails quality filter
      return htmlFor('page', 'A substantial page with plenty of real readable content for the excerpt. '.repeat(3));
    });

    const items = await assembleEdition(
      { fetchCapture, fetchCaptureHtml },
      { domainPool: domains, oversampleCount: 8, targetMax: 20, midCount: 5 }
    );

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => !item.url.includes('b.com'))).toBe(true);
    expect(items[0].tier).toBe('lead');
    if (items.length > 1) expect(items[1].tier).toBe('runnerUp');
  });

  it('returns an empty array when every candidate fails', async () => {
    const fetchCapture = jest.fn().mockResolvedValue(null);
    const fetchCaptureHtml = jest.fn().mockResolvedValue(null);

    const items = await assembleEdition(
      { fetchCapture, fetchCaptureHtml },
      { domainPool: ['a.com'], oversampleCount: 3 }
    );

    expect(items).toEqual([]);
  });

  it('isolates a candidate whose fetchCapture throws, keeping successful candidates', async () => {
    const domains = ['a.com', 'b.com', 'c.com'];

    const fetchCapture = jest.fn(async (domain: string) => {
      if (domain === 'a.com') throw new Error('transient network error');
      return makeRecord(`${domain}-1`);
    });

    const fetchCaptureHtml = jest.fn(async () =>
      htmlFor('page', 'A substantial page with plenty of real readable content for the excerpt. '.repeat(3))
    );

    const items = await assembleEdition(
      { fetchCapture, fetchCaptureHtml },
      { domainPool: domains, oversampleCount: 6, targetMax: 20, midCount: 5 }
    );

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => !item.url.includes('a.com'))).toBe(true);
  });

  it('isolates a candidate whose fetchCaptureHtml throws, keeping successful candidates', async () => {
    const domains = ['a.com', 'b.com', 'c.com'];

    const fetchCapture = jest.fn(async (domain: string) => makeRecord(`${domain}-1`));

    const fetchCaptureHtml = jest.fn(async (record: CdxRecord) => {
      if (record.original.includes('a.com')) throw new Error('timeout fetching html');
      return htmlFor('page', 'A substantial page with plenty of real readable content for the excerpt. '.repeat(3));
    });

    const items = await assembleEdition(
      { fetchCapture, fetchCaptureHtml },
      { domainPool: domains, oversampleCount: 6, targetMax: 20, midCount: 5 }
    );

    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => !item.url.includes('a.com'))).toBe(true);
  });

  it('caps the result at targetMax items', async () => {
    const fetchCapture = jest.fn(async (domain: string) => makeRecord(`${domain}-${Math.random()}`));
    const fetchCaptureHtml = jest.fn(async () =>
      htmlFor('page', 'Plenty of substantial readable content here for the quality filter to pass easily. '.repeat(3))
    );

    const items = await assembleEdition(
      { fetchCapture, fetchCaptureHtml },
      { domainPool: ['a.com'], oversampleCount: 30, targetMax: 10 }
    );

    expect(items.length).toBeLessThanOrEqual(10);
  });
});
