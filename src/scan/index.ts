import type { RuleEvaluator } from './implementations/shared';
import { componentStructuralDuplicate, componentTrueDuplicate } from './implementations/componentStructuralDuplicate';
import { brokenVariableBinding } from './implementations/brokenVariableBinding';
import { instanceDetached, instanceSizeOverride } from './implementations/instances';
import { textMixedColorOrDecoration, textMixedFontFamily } from './implementations/mixedStyles';

export const RULE_IMPLEMENTATIONS: Record<string, RuleEvaluator> = {
  'broken-variable-binding': brokenVariableBinding,
  'text-mixed-font-family': textMixedFontFamily,
  'text-mixed-color-or-decoration': textMixedColorOrDecoration,
  'instance-size-override': instanceSizeOverride,
  'instance-detached': instanceDetached,
  'component-true-duplicate': componentTrueDuplicate,
  'component-structural-duplicate': componentStructuralDuplicate,
};
