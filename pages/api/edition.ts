import type { NextApiRequest, NextApiResponse } from 'next';
import { assembleEdition } from '../../lib/assemble';
import { DOMAIN_POOL } from '../../lib/domains';
import { fetchRandomCapture } from '../../lib/cdx';
import type { CdxRecord, WaybackItem } from '../../lib/types';

export async function withOneRetry<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    const result = await fn();
    if (result !== null) return result;
  } catch (err) {
    console.warn('[withOneRetry] first attempt threw, retrying once', err);
  }
  try {
    return await fn();
  } catch (err) {
    console.warn('[withOneRetry] retry attempt also threw, giving up', err);
    return null;
  }
}

async function fetchCaptureHtmlOnce(record: CdxRecord): Promise<string | null> {
  const url = `https://web.archive.org/web/${record.timestamp}id_/${record.original}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.text();
}

export interface EditionResponse {
  items?: WaybackItem[];
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<EditionResponse>) {
  try {
    const items = await assembleEdition(
      {
        fetchCapture: (domain: string) => withOneRetry(() => fetchRandomCapture(domain)),
        fetchCaptureHtml: (record: CdxRecord) => withOneRetry(() => fetchCaptureHtmlOnce(record)),
      },
      { domainPool: DOMAIN_POOL }
    );
    if (items.length === 0) {
      console.warn('[GET /api/edition] assembleEdition returned zero items');
      res.status(502).json({ error: 'Could not build an edition right now. Try again in a moment.' });
      return;
    }
    res.status(200).json({ items });
  } catch (err) {
    console.error('[GET /api/edition] assembleEdition threw', err);
    res.status(502).json({ error: 'The archive is not responding right now. Try again in a moment.' });
  }
}
