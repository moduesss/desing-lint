import { RULE_META } from './meta';
import type { RuleId } from './meta';
import type { RuleEvaluator } from '../figma';
import type { RuleMeta } from '../utils/types';

import { componentStructuralDuplicate, componentTrueDuplicate } from './implementations/componentStructuralDuplicate';
import { brokenVariableBinding } from './implementations/brokenVariableBinding';
import { engineRuleFailure } from './implementations/engineRuleFailure';
import { instanceDetached, instanceSizeOverride } from './implementations/instances';
import { textMixedColorOrDecoration, textMixedFontFamily } from './implementations/mixedStyles';

export const RULE_IMPLEMENTATIONS: Record<RuleId, RuleEvaluator> = {
  'broken-variable-binding': brokenVariableBinding,
  'text-mixed-font-family': textMixedFontFamily,
  'text-mixed-color-or-decoration': textMixedColorOrDecoration,
  'instance-size-override': instanceSizeOverride,
  'instance-detached': instanceDetached,
  'component-true-duplicate': componentTrueDuplicate,
  'component-structural-duplicate': componentStructuralDuplicate,
  'engine-rule-failure': engineRuleFailure,
};

export { resetUnsafeNodes } from '../figma';

export { RULE_META };
export type { RuleId, RuleEvaluator, RuleMeta };
