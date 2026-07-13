const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function decodeEntities(text: string): string {
  return text.replace(
    /&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;|&#x([0-9a-fA-F]+);|&#(\d+);/g,
    (match, hexCode, decCode) => {
      if (hexCode !== undefined) {
        return String.fromCodePoint(parseInt(hexCode, 16));
      }
      if (decCode !== undefined) {
        return String.fromCodePoint(parseInt(decCode, 10));
      }
      return ENTITY_MAP[match];
    }
  );
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

function extractAttributeValue(tag: string, attrName: string): string | null {
  const re = new RegExp(`${attrName}\\s*=\\s*"([^"]*)"|${attrName}\\s*=\\s*'([^']*)'`, 'i');
  const match = tag.match(re);
  if (!match) return null;
  return match[1] !== undefined ? match[1] : match[2];
}

export function extractMetaDescription(html: string): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi);
  if (!metaTags) return null;

  const descriptionTag = metaTags.find(
    (tag) => extractAttributeValue(tag, 'name')?.toLowerCase() === 'description'
  );
  if (!descriptionTag) return null;

  const content = extractAttributeValue(descriptionTag, 'content');
  if (content === null) return null;

  const text = decodeEntities(content).trim();
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
