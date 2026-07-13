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

export async function assembleEdition(deps: AssembleDeps, options: AssembleOptions): Promise<WaybackItem[]> {
  const oversampleCount = options.oversampleCount ?? 25;
  const targetMax = options.targetMax ?? 20;
  const midCount = options.midCount ?? 5;

  const candidates = await Promise.all(
    Array.from({ length: oversampleCount }, () => pickRandomDomain(options.domainPool)).map(async (domain) => {
      const record = await deps.fetchCapture(domain);
      if (!record) return null;
      if (isBlocked(record.original, domain)) return null;

      const html = await deps.fetchCaptureHtml(record);
      if (!html) return null;
      if (!passesQualityFilter(html)) return null;

      const title = extractTitle(html) ?? new URL(record.original).hostname;
      const description = buildDescription(html);
      const hostType = classifyHostType(`${title} ${description} ${record.original}`);
      const thumbnail = resolveThumbnail(html, record.original, record.timestamp);

      const item: Omit<WaybackItem, 'tier'> = {
        url: record.original,
        captureUrl: `https://web.archive.org/web/${record.timestamp}if_/${record.original}`,
        domain,
        year: captureYear(record.timestamp),
        title,
        description,
        hostType,
        thumbnail,
      };
      return item;
    })
  );

  const validItems = candidates.filter((item): item is Omit<WaybackItem, 'tier'> => item !== null);
  const trimmed = validItems.sort((a, b) => b.description.length - a.description.length).slice(0, targetMax);

  return trimmed.map((item, index) => ({ ...item, tier: assignTier(index, midCount) }));
}
