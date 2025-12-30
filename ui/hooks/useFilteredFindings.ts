import { useMemo } from 'react';
import type { Finding, RuleMetadata } from '../lib/types';
import type { RuleFilter } from '../components/QuickFilters/QuickFilters';
import type { SeverityFilterState } from './useSeverityFilters';

export function useFilteredFindings(
  findings: Finding[],
  severityFilter: SeverityFilterState,
  ruleFilter: RuleFilter,
  getRuleMeta: (ruleId?: string) => RuleMetadata
) {
  return useMemo(() => {
    return findings.filter((finding) => {
      const bySeverity =
        (finding.severity === 'error' && severityFilter.error) ||
        (finding.severity === 'warn' && severityFilter.warn) ||
        (finding.severity === 'info' && severityFilter.info);

      const { category } = getRuleMeta(finding.ruleId);
      const byRule =
        category === 'duplicate' ? ruleFilter.duplicate
        : category === 'mixed' ? ruleFilter.mixed
        : category === 'instance' ? ruleFilter.instance
        : true;

      return bySeverity && byRule;
    });
  }, [findings, severityFilter.error, severityFilter.warn, severityFilter.info, ruleFilter.duplicate, ruleFilter.mixed, ruleFilter.instance, getRuleMeta]);
}
