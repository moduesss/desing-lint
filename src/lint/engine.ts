import type { Finding, LintConfig, LintReport, RuleDefinition, Severity, SeveritySetting, Totals } from '../utils/types';
import { RULE_DEFINITIONS } from './rules';
import { RULE_IMPLEMENTATIONS } from '../scan';
import { resetUnsafeNodes } from '../scan/implementations/shared';
import { DEFAULT_LINT_CONFIG } from './config';

type RuleResolution = {
  enabled: boolean;
  severity: SeveritySetting;
};

function resolveRule(rule: RuleDefinition, config: LintConfig): RuleResolution {
  const levelEnabled = config.levels?.[rule.level] ?? (rule.level !== 'ds');
  const override = config.rules?.[rule.id];
  const enabled = override?.enabled ?? levelEnabled;
  const severity = override?.severity ?? rule.defaultSeverity;
  return { enabled, severity };
}

function normalizeConfig(config?: LintConfig): LintConfig {
  if (!config) return DEFAULT_LINT_CONFIG;
  return {
    levels: Object.assign({}, DEFAULT_LINT_CONFIG.levels, config.levels),
    rules: Object.assign({}, DEFAULT_LINT_CONFIG.rules, config.rules),
    designSystem: Object.assign({}, DEFAULT_LINT_CONFIG.designSystem, config.designSystem),
  };
}

function toTotals(findings: Finding[]): Totals {
  const totals: Totals = { total: findings.length, errors: 0, warns: 0, infos: 0 };
  for (const f of findings) {
    if (f.severity === 'error') totals.errors++;
    else if (f.severity === 'warn') totals.warns++;
    else totals.infos++;
  }
  return totals;
}

export async function runLint(root: DocumentNode, config?: LintConfig): Promise<LintReport> {
  const startedAt = Date.now();
  const normalizedConfig = normalizeConfig(config);
  const findings: Finding[] = [];

  resetUnsafeNodes();

  for (const rule of RULE_DEFINITIONS) {
    const resolution = resolveRule(rule, normalizedConfig);
    if (!resolution.enabled || resolution.severity === 'off') continue;

    const evaluator = RULE_IMPLEMENTATIONS[rule.id];
    if (!evaluator) continue;

    const drafts = await evaluator({ root, config: normalizedConfig });
    for (const draft of drafts) {
      findings.push({
        id: `${rule.id}:${findings.length + 1}`,
        ruleId: rule.id,
        level: rule.level,
        severity: resolution.severity as Severity,
        message: draft.message,
        page: draft.page,
        path: draft.path,
        component: draft.component,
        nodeId: draft.nodeId,
        items: draft.items,
      });
    }
  }

  const finishedAt = Date.now();
  return {
    startedAt,
    finishedAt,
    totals: toTotals(findings),
    findings,
  };
}
