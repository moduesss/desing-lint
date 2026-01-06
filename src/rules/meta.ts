import type { RuleMeta } from '../utils/types';

export const RULE_META: RuleMeta[] = [
  {
    id: 'broken-variable-binding',
    level: 'structural',
    defaultSeverity: 'error',
    metadata: {
      category: 'other',
      priority: 3,
      labels: ['variables', 'integrity'],
    },
  },
  {
    id: 'component-true-duplicate',
    level: 'ds',
    defaultSeverity: 'warn',
    notes: 'Name-based comparison alone is insufficient and must not be used.',
    metadata: {
      category: 'duplicate',
      priority: 0,
      labels: ['duplicate'],
    },
  },
  {
    id: 'text-mixed-font-family',
    level: 'structural',
    defaultSeverity: 'error',
    metadata: {
      category: 'mixed',
      priority: 1,
      labels: ['mixed', 'text'],
    },
  },
  {
    id: 'text-mixed-color-or-decoration',
    level: 'stylistic',
    defaultSeverity: 'info',
    metadata: {
      category: 'mixed',
      priority: 1,
      labels: ['mixed', 'text'],
    },
  },
  {
    id: 'instance-size-override',
    level: 'stylistic',
    defaultSeverity: 'off',
    notes: 'This rule should be disabled by default.',
    metadata: {
      category: 'instance',
      priority: 2,
      labels: ['instance'],
    },
  },
  {
    id: 'component-structural-duplicate',
    level: 'structural',
    defaultSeverity: 'warn',
    notes:
      'Comparison is structural only: no name matching, no design-system configuration, and no variants of the same Component Set.',
    metadata: {
      category: 'duplicate',
      priority: 0,
      labels: ['duplicate'],
    },
  },
  {
    id: 'instance-detached',
    level: 'structural',
    defaultSeverity: 'error',
    metadata: {
      category: 'instance',
      priority: 2,
      labels: ['instance'],
    },
  },
  {
    id: 'engine-rule-failure',
    level: 'structural',
    defaultSeverity: 'warn',
    metadata: {
      category: 'other',
      priority: 3,
      labels: ['engine', 'stability'],
    },
  },
] as const;

export type RuleId = (typeof RULE_META)[number]['id'];
