import { isBlocked } from './blocklist';
import { passesQualityFilter } from './quality';
import { buildDescription, extractTitle } from './excerpt';
import { classifyHostType } from './hostType';
import { resolveThumbnail } from './thumbnail';
import type { CdxRecord, Tier, WaybackItem } from './types';

export interface AssembleDeps {
  fetchCapture: (domain: string) => Promise<CdxRecord | null>;
  fetchCaptureHtml: (record: CdxRecord) => Promise<string | null>;
}

export interface AssembleOptions {
  domainPool: string[];
  oversampleCount?: number;
  targetMax?: number;
  midCount?: number;
  blockedDomains?: string[];
  blockedUrlSubstrings?: string[];
  concurrencyLimit?: number;
}

function captureYear(timestamp: string): number {
  return parseInt(timestamp.slice(0, 4), 10);
}

function pickRandomDomain(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

function assignTier(index: number, midCount: number): Tier {
  if (index === 0) return 'lead';
  if (index === 1) return 'runnerUp';
  if (index < 2 + midCount) return 'mid';
  return 'brief';
}

// Firing every candidate at once can exceed what the local network/OS/CDX
// server will sustain in concurrent connections to the same host, causing
// widespread connection failures. Bound concurrency instead.
async function mapWithConcurrencyLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function assembleEdition(deps: AssembleDeps, options: AssembleOptions): Promise<WaybackItem[]> {
  const oversampleCount = options.oversampleCount ?? 25;
  const targetMax = options.targetMax ?? 20;
  const midCount = options.midCount ?? 5;
  const concurrencyLimit = options.concurrencyLimit ?? 3;

  const domains = Array.from({ length: oversampleCount }, () => pickRandomDomain(options.domainPool));
  const candidates = await mapWithConcurrencyLimit(domains, concurrencyLimit, async (domain) => {
    try {
      const record = await deps.fetchCapture(domain);
      if (!record) {
        console.warn(`[assembleEdition] dropped candidate: no capture found for domain=${domain}`);
        return null;
      }

      const capturedHost = new URL(record.original).hostname;
      if (isBlocked(record.original, capturedHost, options.blockedDomains, options.blockedUrlSubstrings)) {
        console.warn(`[assembleEdition] dropped candidate: blocked host=${capturedHost} url=${record.original}`);
        return null;
      }

      const html = await deps.fetchCaptureHtml(record);
      if (!html) {
        console.warn(`[assembleEdition] dropped candidate: no HTML fetched for url=${record.original}`);
        return null;
      }
      if (!passesQualityFilter(html)) {
        console.warn(`[assembleEdition] dropped candidate: failed quality filter for url=${record.original}`);
        return null;
      }

      const title = extractTitle(html) ?? capturedHost;
      const description = buildDescription(html);
      const hostType = classifyHostType(`${title} ${description} ${record.original}`);
      const thumbnail = resolveThumbnail(html, record.original, record.timestamp);

      const item: Omit<WaybackItem, 'tier'> = {
        url: record.original,
        captureUrl: `https://web.archive.org/web/${record.timestamp}if_/${record.original}`,
        domain: capturedHost,
        year: captureYear(record.timestamp),
        title,
        description,
        hostType,
        thumbnail,
      };
      return item;
    } catch (err) {
      // A single candidate's failure (network error, timeout, etc.) is dropped
      // rather than allowed to reject the whole assembleEdition call.
      console.warn(`[assembleEdition] dropped candidate: threw for domain=${domain}`, err);
      return null;
    }
  });

  const validItems = candidates.filter((item): item is Omit<WaybackItem, 'tier'> => item !== null);
  const trimmed = validItems.sort((a, b) => b.description.length - a.description.length).slice(0, targetMax);

  return trimmed.map((item, index) => ({ ...item, tier: assignTier(index, midCount) }));
}
