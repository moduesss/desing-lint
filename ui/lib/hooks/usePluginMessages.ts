import { useEffect, useState } from 'react';
import type { Finding, RuleMeta, Totals } from '../types';
import type { PluginToUi, ScanStatus } from '../plugin/types';

export function usePluginMessages(initialTotals: Totals) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [results, setResults] = useState<Finding[]>([]);
  const [totals, setTotals] = useState<Totals>(initialTotals);
  const [rules, setRules] = useState<RuleMeta[]>([]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = (e.data || {}).pluginMessage as PluginToUi | undefined;
      if (!msg) return;
      switch (msg.type) {
        case 'STATUS':
          setStatus(msg.status);
          break;
        case 'RESULTS':
          setResults(msg.report.findings);
          setTotals(msg.report.totals);
          setRules(msg.rules);
          break;
        case 'RULES':
          setRules(msg.rules);
          break;
        case 'APPEND_LOG':
          // игнорируем — логи скрыты в UI
          break;
      }
    };
    (window as any).onmessage = handler;
    return () => {
      (window as any).onmessage = null;
    };
  }, []);

  return { status, setStatus, results, setResults, totals, setTotals, rules };
}
