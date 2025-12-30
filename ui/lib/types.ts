export type LintLevel = 'structural' | 'stylistic' | 'ds';

export type Severity = 'error' | 'warn' | 'info';
export type SeveritySetting = Severity | 'off';

export type RuleCategory = 'duplicate' | 'mixed' | 'instance' | 'other';

export type RuleMetadata = {
  category: RuleCategory;
  priority: number;
  labels: string[];
};

export type RuleMeta = {
  id: string;
  level: LintLevel;
  defaultSeverity: SeveritySetting;
  notes?: string;
  metadata: RuleMetadata;
};

export type RuleCopy = {
  title: string;
  description: string;
  rationale: string;
  whenTriggered: string;
  message: string;
};

// Backward compatibility alias; prefer RuleMeta.
export type RuleDefinition = RuleMeta;

export type Finding = {
  id: string;
  ruleId: string;
  level: LintLevel;
  severity: Severity;
  message: string;
  page?: string;
  path?: string;
  component?: string;
  nodeId?: string;
  items?: Array<{
    label: string;
    nodeId: string;
    path?: string;
    page?: string;
  }>;
};

export type Totals = { total: number; errors: number; warns: number; infos: number };

export type LintReport = {
  startedAt: number;
  finishedAt: number;
  totals: Totals;
  findings: Finding[];
};
