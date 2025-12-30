import { useCallback, useState } from 'react';
import type { RuleFilter } from '../components/QuickFilters/QuickFilters';

export function useRuleFilters(initial: RuleFilter = { duplicate: true, mixed: true, instance: true }) {
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>(initial);

  const toggleRule = useCallback((key: keyof RuleFilter) => {
    setRuleFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleRulesAll = useCallback(() => {
    setRuleFilter((prev) => {
      const allOn = prev.duplicate && prev.mixed && prev.instance;
      return allOn ? { duplicate: false, mixed: false, instance: false } : { duplicate: true, mixed: true, instance: true };
    });
  }, []);

  return { ruleFilter, setRuleFilter, toggleRule, toggleRulesAll };
}
