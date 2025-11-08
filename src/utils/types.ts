// Общие типы UI ↔ code

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
export type Severity = 'error' | 'warn' | 'info';

export type Finding = {
  id: string;
  severity: Severity;
  message: string;

  // путь в дереве (Page / Frame / ...). Используем для группировки
  path?: string;

  // компонент (если найден: имя master-компонента или вар-та)
  component?: string;

  // для подсветки в редакторе
  nodeId?: string;
};

export type Totals = {
  total: number;
  errors: number;
  warns: number;
  infos: number;
};

export type PluginToUi =
  | { type: 'STATUS'; status: ScanStatus }
  | { type: 'RESULTS'; results: Finding[]; totals: Totals }
  | { type: 'APPEND_LOG'; text: string };

export type UiToPlugin =
  | { type: 'RUN_SCAN' }
  | { type: 'HIGHLIGHT'; nodeId: string }
  | { type: 'COPY'; text: string }
  | { type: 'EXPORT_JSON' };
