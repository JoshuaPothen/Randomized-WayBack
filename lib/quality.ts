import { extractVisibleText } from './excerpt';

export function passesQualityFilter(html: string, minLength = 100): boolean {
  return extractVisibleText(html).length >= minLength;
}
