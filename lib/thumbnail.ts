import type { ThumbnailInfo } from './types';

const JUNK_IMAGE_PATTERNS = [/spacer/i, /pixel/i, /blank/i, /button/i, /\bnav/i, /bullet/i, /divider/i, /rule\.gif/i, /line\.gif/i];
const MIN_DIMENSION = 40;
const DEFAULT_COLOR = '#e8e2d0';

const ATTR_BOUNDARY = '(?:^|[\\s"\'])';

function extractDimension(tag: string, attr: 'width' | 'height'): number | null {
  const match = tag.match(new RegExp(`${ATTR_BOUNDARY}${attr}=["']?(\\d+)`, 'i'));
  return match ? parseInt(match[1], 10) : null;
}

export function findFirstSuitableImage(html: string): string | null {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const srcMatch = tag.match(new RegExp(`${ATTR_BOUNDARY}src=["']([^"']+)["']`, 'i'));
    if (!srcMatch) continue;
    const src = srcMatch[1];
    if (JUNK_IMAGE_PATTERNS.some((pattern) => pattern.test(src))) continue;
    const width = extractDimension(tag, 'width');
    const height = extractDimension(tag, 'height');
    if ((width !== null && width < MIN_DIMENSION) || (height !== null && height < MIN_DIMENSION)) continue;
    return src;
  }
  return null;
}

function normalizeColor(value: string): string {
  return value.startsWith('#') ? value : /^[a-z]+$/i.test(value) ? value : `#${value}`;
}

export function extractPageColor(html: string): string | null {
  const bodyMatch = html.match(/<body\b[^>]*>/i);
  if (!bodyMatch) return null;
  const bgcolorMatch = bodyMatch[0].match(new RegExp(`${ATTR_BOUNDARY}bgcolor=["']?([^"'\\s>]+)`, 'i'));
  if (bgcolorMatch) return normalizeColor(bgcolorMatch[1]);
  const styleMatch = bodyMatch[0].match(/style=["']([^"']*)["']/i);
  if (styleMatch) {
    const colorMatch = styleMatch[1].match(/background(?:-color)?\s*:\s*([^;"']+)/i);
    if (colorMatch) return normalizeColor(colorMatch[1].trim());
  }
  return null;
}

export function resolveImageUrl(src: string, originalPageUrl: string, timestamp: string): string {
  const absolute = new URL(src, originalPageUrl).toString();
  return `https://web.archive.org/web/${timestamp}if_/${absolute}`;
}

export function resolveThumbnail(html: string, originalPageUrl: string, timestamp: string): ThumbnailInfo {
  const imgSrc = findFirstSuitableImage(html);
  const color = extractPageColor(html) ?? DEFAULT_COLOR;
  return {
    imageUrl: imgSrc ? resolveImageUrl(imgSrc, originalPageUrl, timestamp) : null,
    color,
  };
}
