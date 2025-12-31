import type { Finding, RuleCopy } from '../../lib/types';

export function formatRuleMessage(finding: Finding, copy?: RuleCopy): string {
  const template = copy?.message;
  if (!template) return finding.message;
  if (template.includes('{{component}}') && !finding.component) return finding.message;
  return template.replace(/{{\s*component\s*}}/g, finding.component || '');
}

export function truncateBadge(text: string, limit = 128): string {
  if (text.length <= limit) return text;
  const cut = limit > 3 ? limit - 3 : limit;
  return `${text.slice(0, cut)}...`;
}
