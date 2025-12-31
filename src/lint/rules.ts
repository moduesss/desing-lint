export { RULE_META } from './rules/meta';
export type { RuleId } from './rules/meta';
export type { RuleMeta } from '../utils/types';

// Backward compatibility: some code imports RULE_DEFINITIONS.
export { RULE_META as RULE_DEFINITIONS } from './rules/meta';
