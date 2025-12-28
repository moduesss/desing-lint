import type { LintReport, RuleDefinition, Totals } from '../types';

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';

export type PluginToUi =
  | { type: 'STATUS'; status: ScanStatus }
  | { type: 'RESULTS'; report: LintReport; rules: RuleDefinition[] }
  | { type: 'RULES'; rules: RuleDefinition[] }
  | { type: 'APPEND_LOG'; text: string };

export const initialTotals: Totals = { total: 0, errors: 0, warns: 0, infos: 0 };
