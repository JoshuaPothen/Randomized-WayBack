import type { HostType } from './types';

interface Rule {
  pattern: RegExp;
  hostType: HostType;
}

const RULES: Rule[] = [
  { pattern: /webring/i, hostType: 'Webring' },
  { pattern: /fan\s?fic|fanfic/i, hostType: 'Fan Archive' },
  { pattern: /\bclub\b|hobby|collectors?/i, hostType: 'Hobby Club' },
];

export function classifyHostType(text: string): HostType {
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.hostType;
  }
  return 'Personal Homepage';
}
