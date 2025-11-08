import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import Results from './components/Results';
import Spinner from './components/Spinner';
import { groupByPage } from './lib/grouping';
import type { Finding } from './lib/types';
import './styles.scss';

/** Локальные типы, чтобы не зависеть от кеша TS для модуля ./lib/types */
type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
type Totals = { total: number; errors: number; warns: number; infos: number };
type PluginToUi =
  | { type: 'STATUS'; status: ScanStatus }
  | { type: 'RESULTS'; results: Finding[]; totals: Totals }
  | { type: 'APPEND_LOG'; text: string };

const initialTotals: Totals = { total: 0, errors: 0, warns: 0, infos: 0 };

export default function App() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [results, setResults] = useState<Finding[]>([]);
  const [totals, setTotals] = useState<Totals>(initialTotals);
  const [filter, setFilter] = useState({ error: true, warn: true, info: true });
  const [collapsedPages, setCollapsedPages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (window as any).onmessage = (e: MessageEvent) => {
      const msg = (e.data || {}).pluginMessage as PluginToUi | undefined;
      if (!msg) return;
      if (msg.type === 'STATUS') setStatus(msg.status);
      if (msg.type === 'RESULTS') {
        setResults(msg.results);
        setTotals(msg.totals);
        setStatus('completed');
        setCollapsedPages({});
      }
    };
  }, []);

  const onRun = () => {
    if (status === 'scanning') return;
    setStatus('scanning');
    parent.postMessage({ pluginMessage: { type: 'RUN_SCAN' } }, '*');
  };

  const exportJson = () => parent.postMessage({ pluginMessage: { type: 'EXPORT_JSON' } }, '*');

  const copySlack = () => {
    const lines = results.map(
      (r) => `• ${r.severity.toUpperCase()} — ${r.message}${r.path ? ` (${r.path})` : ''}`
    );
    parent.postMessage({ pluginMessage: { type: 'COPY', text: lines.join('\n') } }, '*');
  };

  const copyJira = () => {
    const md = results
      .map((r) => `- [${r.severity}] ${r.message}${r.path ? ` \`(${r.path})\`` : ''}`)
      .join('\n');
    parent.postMessage({ pluginMessage: { type: 'COPY', text: md } }, '*');
  };

  const onHighlight = (nodeId: string) =>
    parent.postMessage({ pluginMessage: { type: 'HIGHLIGHT', nodeId } }, '*');

  const autosummed: Totals = useMemo(() => {
    if (totals.total) return totals;
    const t: Totals = { total: results.length, errors: 0, warns: 0, infos: 0 };
    for (const r of results) {
      if (r.severity === 'error') t.errors++;
      else if (r.severity === 'warn') t.warns++;
      else t.infos++;
    }
    return t;
  }, [results, totals]);

  const filtered = useMemo(() => {
    return results.filter(
      (r) =>
        (r.severity === 'error' && filter.error) ||
        (r.severity === 'warn' && filter.warn) ||
        (r.severity === 'info' && filter.info)
    );
  }, [results, filter]);

  const grouped = useMemo(() => groupByPage(filtered), [filtered]);

  const toggleCounter = (key: 'error' | 'warn' | 'info') =>
    setFilter((f) => ({ ...f, [key]: !f[key] }));

  const toggleAll = () =>
    setFilter((f) => {
      const allOn = f.error && f.warn && f.info;
      return allOn ? { error: false, warn: false, info: false } : { error: true, warn: true, info: true };
    });

  const togglePage = (page: string) =>
    setCollapsedPages((s) => ({ ...s, [page]: !s[page] }));

  return (
    <div className="app">
      <Header
        onRun={onRun}
        onExport={exportJson}
        onCopySlack={copySlack}
        onCopyJira={copyJira}
        disabled={status === 'scanning'}
      />

      <StatusBar
        status={status}
        totals={autosummed}
        filter={filter}
        onClickError={() => toggleCounter('error')}
        onClickWarn={() => toggleCounter('warn')}
        onClickInfo={() => toggleCounter('info')}
        onClickTotal={toggleAll}
      />

      {status === 'scanning' && (
        <div className="block panel mt-8" role="status" aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Spinner />
            <div style={{ fontSize: 13 }}>Сканирование… Это может занять несколько секунд.</div>
          </div>
        </div>
      )}

      <Results
        grouped={grouped}
        collapsedPages={collapsedPages}
        onTogglePage={togglePage}
        onHighlight={onHighlight}
        isEmpty={!filtered.length}
      />
    </div>
  );
}
