export type LintLevel = 'structural' | 'stylistic' | 'ds';

export type Severity = 'error' | 'warn' | 'info';
export type SeveritySetting = Severity | 'off';

export type RuleDefinition = {
  id: string;
  level: LintLevel;
  defaultSeverity: SeveritySetting;
  title: string;
  description: string;
  rationale: string;
  whenTriggered: string;
  notes?: string;
};

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
