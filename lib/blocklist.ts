// Starter lists — expand as specific famous/known personal pages are identified.
export const BLOCKED_DOMAINS: string[] = [];
export const BLOCKED_URL_SUBSTRINGS: string[] = [];

export function isBlocked(
  url: string,
  domain: string,
  blockedDomains: string[] = BLOCKED_DOMAINS,
  blockedUrlSubstrings: string[] = BLOCKED_URL_SUBSTRINGS
): boolean {
  if (blockedDomains.includes(domain)) return true;
  return blockedUrlSubstrings.some((substring) => url.includes(substring));
}
