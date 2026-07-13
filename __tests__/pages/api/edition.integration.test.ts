import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/edition';

// This test intentionally does NOT mock lib/assemble, so the real
// assembleEdition pipeline runs end-to-end (CDX lookup -> capture HTML
// fetch -> quality/blocklist filtering -> WaybackItem assembly). Only the
// network boundary (global.fetch) is mocked.
describe('/api/edition (integration, real assembleEdition)', () => {
  const realHtml = `
    <html>
      <head><title>Reef Dave's Homepage</title></head>
      <body>
        <p>${'A substantial page with plenty of real readable content for the excerpt. '.repeat(5)}</p>
      </body>
    </html>
  `;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns 200 with a real item built through the actual assembleEdition pipeline', async () => {
    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes('showNumPages=true')) {
        return {
          ok: true,
          text: async () => '1',
        } as Response;
      }

      if (url.includes('cdx/search/cdx')) {
        return {
          ok: true,
          json: async () => [
            ['urlkey', 'timestamp', 'original', 'mimetype', 'statuscode', 'digest', 'length'],
            [
              'com,tripod,reefdave)/page',
              '19990101000000',
              'http://reefdave.tripod.com/page',
              'text/html',
              '200',
              'abc123',
              '1024',
            ],
          ],
        } as Response;
      }

      if (url.includes('web.archive.org/web/')) {
        return {
          ok: true,
          text: async () => realHtml,
        } as Response;
      }

      throw new Error(`Unexpected fetch URL in test: ${url}`);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const body = JSON.parse(res._getData());
    expect(body.items.length).toBeGreaterThan(0);

    const item = body.items[0];
    expect(item.url).toBe('http://reefdave.tripod.com/page');
    expect(item.domain).toBe('reefdave.tripod.com');
    expect(item.title).toBe("Reef Dave's Homepage");
    expect(item.captureUrl).toBe('https://web.archive.org/web/19990101000000if_/http://reefdave.tripod.com/page');
    expect(['lead', 'runnerUp', 'mid', 'brief']).toContain(item.tier);
    expect(item.thumbnail).toBeDefined();
  });
});
