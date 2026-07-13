const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function decodeEntities(text: string): string {
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (match) => ENTITY_MAP[match]);
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

export function extractVisibleText(html: string): string {
  const withoutScriptsAndStyles = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = decodeEntities(stripTags(withoutScriptsAndStyles));
  return text.replace(/\s+/g, ' ').trim();
}

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return null;
  const text = decodeEntities(stripTags(match[1])).trim();
  return text.length > 0 ? text : null;
}

export function extractMetaDescription(html: string): string | null {
  const tagMatch = html.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  if (!tagMatch) return null;
  const contentMatch = tagMatch[0].match(/content=["']([^"']*)["']/i);
  if (!contentMatch) return null;
  const text = decodeEntities(contentMatch[1]).trim();
  return text.length > 0 ? text : null;
}

export function extractFirstParagraphText(html: string, minLength = 40, maxLength = 220): string | null {
  const text = extractVisibleText(html);
  if (text.length < minLength) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

export function buildDescription(html: string): string {
  const meta = extractMetaDescription(html);
  if (meta) return meta;
  const paragraph = extractFirstParagraphText(html);
  if (paragraph) return paragraph;
  return 'No description available.';
}
