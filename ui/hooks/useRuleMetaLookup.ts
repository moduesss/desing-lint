import { useCallback, useMemo } from 'react';
import type { RuleMeta, RuleMetadata } from '../lib/types';

type RuleMetaGetter = (ruleId?: string) => RuleMetadata;

function deriveFallback(ruleId?: string): RuleMetadata {
  const category =
    ruleId === 'component-true-duplicate' || ruleId === 'component-structural-duplicate' ? 'duplicate'
    : ruleId === 'text-mixed-font-family' || ruleId === 'text-mixed-color-or-decoration' ? 'mixed'
    : ruleId === 'instance-size-override' || ruleId === 'instance-detached' ? 'instance'
    : 'other';

  const priority =
    category === 'duplicate' ? 0
    : category === 'mixed' ? 1
    : category === 'instance' ? 2
    : 3;

  return { category, priority, labels: [category] };
}

export function useRuleMetaLookup(rules: RuleMeta[]): { rulesById: Map<string, RuleMeta>; getRuleMeta: RuleMetaGetter } {
  const rulesById = useMemo(() => {
    const entries: Array<[string, RuleMeta]> = rules.map((rule) => [rule.id, rule]);
    return new Map(entries);
  }, [rules]);

  const fallbackMeta = useCallback((ruleId?: string) => deriveFallback(ruleId), []);

  const getRuleMeta = useCallback<RuleMetaGetter>((ruleId?: string) => {
    if (!ruleId) return fallbackMeta(ruleId);
    const def = rulesById.get(ruleId);
    if (def?.metadata) return def.metadata;
    return fallbackMeta(ruleId);
  }, [rulesById, fallbackMeta]);

  return { rulesById, getRuleMeta };
}
