import type { LintConfig } from '../utils/types';

export const DEFAULT_LINT_CONFIG: LintConfig = {
  levels: {
    structural: true,
    stylistic: true,
    ds: false,
  },
  rules: {},
  designSystem: {},
};
