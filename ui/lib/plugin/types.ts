import type { Finding } from './types';

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
export type Totals = { total: number; errors: number; warns: number; infos: number };

export type PluginToUi =
  | { type: 'STATUS'; status: ScanStatus }
  | { type: 'RESULTS'; results: Finding[]; totals: Totals }
  | { type: 'APPEND_LOG'; text: string };

export const initialTotals: Totals = { total: 0, errors: 0, warns: 0, infos: 0 };
