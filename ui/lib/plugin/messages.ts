import type { LintReport, RuleMeta, Totals, PluginToUi, ScanStatus } from '../types';

export type { PluginToUi, ScanStatus };

export const initialTotals: Totals = { total: 0, errors: 0, warns: 0, infos: 0 };
