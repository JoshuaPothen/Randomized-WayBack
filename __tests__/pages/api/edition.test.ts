import { createMocks } from 'node-mocks-http';
import handler, { withOneRetry } from '../../../pages/api/edition';
import { assembleEdition } from '../../../lib/assemble';

jest.mock('../../../lib/assemble');

const mockAssembleEdition = assembleEdition as jest.MockedFunction<typeof assembleEdition>;

describe('withOneRetry', () => {
  it('returns the result on first success without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    expect(await withOneRetry(fn)).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries once after a null result and returns the retry value', async () => {
    const fn = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('ok');
    expect(await withOneRetry(fn)).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries once after a thrown error, then returns null if it fails again', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(null);
    expect(await withOneRetry(fn)).toBeNull();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('/api/edition', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns 200 with items on success', async () => {
    mockAssembleEdition.mockResolvedValue([
      {
        url: 'http://example.com/x',
        captureUrl: 'https://web.archive.org/web/19990101000000if_/http://example.com/x',
        domain: 'example.com',
        year: 1999,
        title: 'Example',
        description: 'An example page.',
        hostType: 'Personal Homepage',
        tier: 'lead',
        thumbnail: { imageUrl: null, color: '#e8e2d0' },
      },
    ]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData()).items).toHaveLength(1);
  });

  it('returns 502 when assembleEdition returns an empty array', async () => {
    mockAssembleEdition.mockResolvedValue([]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(502);
    expect(JSON.parse(res._getData()).error).toBeDefined();
  });

  it('returns 502 when assembleEdition throws', async () => {
    mockAssembleEdition.mockRejectedValue(new Error('CDX unreachable'));

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(502);
    expect(JSON.parse(res._getData()).error).toBeDefined();
  });
});
