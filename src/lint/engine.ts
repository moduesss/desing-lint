import type { Finding, LintConfig, LintReport, RuleMeta, Severity, SeveritySetting, Totals } from '../utils/types';
import { RULE_META } from './rules';
import { RULE_IMPLEMENTATIONS } from '../scan';
import { resetUnsafeNodes } from '../scan/implementations/shared';
import { DEFAULT_LINT_CONFIG } from './config';

type RuleResolution = {
  enabled: boolean;
  severity: SeveritySetting;
};

async function ensurePagesLoaded(): Promise<void> {
const loader = (figma as any).loadAllPagesAsync;
  if (typeof loader !== 'function') {
    throw new Error('figma.loadAllPagesAsync is required when using documentAccess: dynamic-page');
  }
  // Must run before any traversal; removing or moving this call will break scans in dynamic-page mode.
  await loader.call(figma);
}

function resolveRule(rule: RuleMeta, config: LintConfig): RuleResolution {
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
  resetUnsafeNodes();

  await ensurePagesLoaded();

  const startedAt = Date.now();
  const normalizedConfig = normalizeConfig(config);
  const findings: Finding[] = [];
  const failureRuleId = 'engine-rule-failure';
  const failureMeta = RULE_META.find((meta) => meta.id === failureRuleId);
  const failureLevel = failureMeta?.level ?? 'structural';

  for (const rule of RULE_META) {
    const resolution = resolveRule(rule, normalizedConfig);
    if (!resolution.enabled || resolution.severity === 'off') continue;

    const evaluator = RULE_IMPLEMENTATIONS[rule.id];
    if (!evaluator) continue;

    let drafts: Awaited<ReturnType<typeof evaluator>>;
    try {
      drafts = await evaluator({ root, config: normalizedConfig });
    } catch (err) {
      const rawMessage =
        err instanceof Error && err.message ? err.message : String(err);
      const message = rawMessage.length > 200 ? rawMessage.slice(0, 200) : rawMessage;
      // eslint-disable-next-line no-console
      console.error('[Design Lint] rule evaluator failed', rule.id, err);
      findings.push({
        id: `${failureRuleId}:${findings.length + 1}`,
        ruleId: failureRuleId,
        level: failureLevel,
        severity: 'warn',
        message: `Rule "${rule.id}" failed during scan: ${message}`,
        page: '(Engine)',
        component: '(Scan)',
        items: [],
      });
      continue;
    }
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
