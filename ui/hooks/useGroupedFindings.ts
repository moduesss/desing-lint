import { useMemo } from 'react';
import type { Finding, RuleMetadata } from '../lib/types';
import { groupByPageAndComponent, type PageGroup } from '../lib/utils/grouping';

export function useGroupedFindings(
  filtered: Finding[],
  getRuleMeta: (ruleId?: string) => RuleMetadata
): { ordered: Finding[]; grouped: PageGroup[] } {
  const ordered = useMemo(() => {
    return filtered
      .map((item, idx) => ({ item, idx }))
      .sort((a, b) => {
        const pa = getRuleMeta(a.item.ruleId).priority;
        const pb = getRuleMeta(b.item.ruleId).priority;
        if (pa !== pb) return pa - pb;
        return a.idx - b.idx;
      })
      .map(({ item }) => item);
  }, [filtered, getRuleMeta]);

  const grouped = useMemo(() => groupByPageAndComponent(ordered), [ordered]);

  return { ordered, grouped };
}
