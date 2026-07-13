import type { CdxRecord } from './types';

export type FetchFn = (url: string) => Promise<Response>;

const PAGE_SIZE = 5;
const CDX_FILTERS = 'collapse=urlkey&filter=statuscode:200&filter=mimetype:text/html';

export async function getNumPages(domain: string, fetchFn: FetchFn = fetch): Promise<number> {
  const url = `https://web.archive.org/cdx/search/cdx?url=${domain}/*&matchType=domain&${CDX_FILTERS}&output=json&showNumPages=true&pageSize=${PAGE_SIZE}`;
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`CDX numPages request failed: ${res.status}`);
  const text = (await res.text()).trim();
  const n = parseInt(text, 10);
  return Number.isNaN(n) ? 0 : n;
}

export async function fetchRandomCapture(domain: string, fetchFn: FetchFn = fetch): Promise<CdxRecord | null> {
  const numPages = await getNumPages(domain, fetchFn);
  if (numPages <= 0) return null;

  const page = Math.floor(Math.random() * numPages);
  const url = `https://web.archive.org/cdx/search/cdx?url=${domain}/*&matchType=domain&${CDX_FILTERS}&output=json&page=${page}&pageSize=${PAGE_SIZE}`;
  const res = await fetchFn(url);
  if (!res.ok) return null;

  const rows: string[][] = await res.json();
  const records = rows.slice(1);
  if (records.length === 0) return null;

  const [urlkey, timestamp, original, mimetype, statuscode, digest, length] = records[Math.floor(Math.random() * records.length)];
  return { urlkey, timestamp, original, mimetype, statuscode, digest, length };
}
