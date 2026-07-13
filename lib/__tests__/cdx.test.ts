import { getNumPages, fetchRandomCapture } from '../cdx';

function mockResponse(body: string, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as Response;
}

describe('getNumPages', () => {
  it('parses the real CDX showNumPages=true response shape', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(JSON.stringify([['numpages'], ['6357']])));
    const result = await getNumPages('tripod.com', fetchFn);
    expect(result).toBe(6357);
    expect(fetchFn).toHaveBeenCalledWith(expect.stringContaining('showNumPages=true'));
  });

  it('throws when the request fails', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse('', false));
    await expect(getNumPages('tripod.com', fetchFn)).rejects.toThrow();
  });

  it('returns 0 for a non-numeric body', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(JSON.stringify([['numpages'], ['not-a-number']])));
    expect(await getNumPages('tripod.com', fetchFn)).toBe(0);
  });

  it('returns 0 when the response body is malformed JSON', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse('not-json-at-all'));
    expect(await getNumPages('tripod.com', fetchFn)).toBe(0);
  });
});

describe('fetchRandomCapture', () => {
  const cdxRows = [
    ['urlkey', 'timestamp', 'original', 'mimetype', 'statuscode', 'digest', 'length'],
    ['com,tripod)/reefdave', '19990101000000', 'http://tripod.com/reefdave', 'text/html', '200', 'abc123', '4096'],
  ];

  it('returns a record from a single-page result', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(mockResponse(JSON.stringify([['numpages'], ['1']]))) // getNumPages
      .mockResolvedValueOnce(mockResponse(JSON.stringify(cdxRows))); // page fetch

    const record = await fetchRandomCapture('tripod.com', fetchFn);
    expect(record).toEqual({
      urlkey: 'com,tripod)/reefdave',
      timestamp: '19990101000000',
      original: 'http://tripod.com/reefdave',
      mimetype: 'text/html',
      statuscode: '200',
      digest: 'abc123',
      length: '4096',
    });
  });

  it('returns null when there are zero pages', async () => {
    const fetchFn = jest.fn().mockResolvedValueOnce(mockResponse(JSON.stringify([['numpages'], ['0']])));
    expect(await fetchRandomCapture('tripod.com', fetchFn)).toBeNull();
  });

  it('returns null when the page fetch fails', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(mockResponse(JSON.stringify([['numpages'], ['1']])))
      .mockResolvedValueOnce(mockResponse('', false));
    expect(await fetchRandomCapture('tripod.com', fetchFn)).toBeNull();
  });
});
