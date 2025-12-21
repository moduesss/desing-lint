import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import Results from './components/Results';
import Spinner from './components/Spinner';
import { groupByPageAndComponent } from './lib/grouping';
import type { Finding } from './lib/types';
import './styles.scss';

// Локальные типы — чтобы не зависеть от кеша TS
type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
type Totals = { total: number; errors: number; warns: number; infos: number };
type PluginToUi =
  | { type: 'STATUS'; status: ScanStatus }
  | { type: 'RESULTS'; results: Finding[]; totals: Totals }
  | { type: 'APPEND_LOG'; text: string };

const initialTotals: Totals = { total: 0, errors: 0, warns: 0, infos: 0 };

function copyText(text: string) {
  try {
    // Без navigator.clipboard — через скрытый textarea
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  } catch {
    // последняя линия обороны
    alert('Не удалось скопировать в буфер. Выделите текст вручную.');
  }
}

export default function App() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [results, setResults] = useState<Finding[]>([]);
  const [totals, setTotals] = useState<Totals>(initialTotals);
  const [filter, setFilter] = useState({ error: true, warn: true, info: true });
  const [collapsedPages, setCollapsedPages] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const rules = [
    'Ищем дубликаты локальных компонентов на одной странице.',
    'Проверяем смешанные стили (fills, strokes, effects, fontName, textStyleId).',
    'Выявляем экземпляры, отличающиеся по размеру от master или отвязанные от библиотеки.',
  ];

  useEffect(() => {
    (window as any).onmessage = (e: MessageEvent) => {
      const msg = (e.data || {}).pluginMessage as PluginToUi | undefined;
      if (!msg) return;
      switch (msg.type) {
        case 'STATUS':
          setStatus(msg.status);
          break;
        case 'RESULTS':
          setResults(msg.results);
          setTotals(msg.totals);
          setCollapsedPages({});
          break;
        case 'APPEND_LOG':
          setLogs((ls) => [...ls, msg.text]);
          break;
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
    copyText(lines.join('\n'));
  };

  const copyJira = () => {
    const md = results
      .map((r) => `- [${r.severity}] ${r.message}${r.path ? ` \`(${r.path})\`` : ''}`)
      .join('\n');
    copyText(md);
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

  const grouped = useMemo(() => groupByPageAndComponent(filtered), [filtered]);

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

      <div className="canvas">
        <div className="panel intro">
          <div>
            <div className="eyebrow">Что проверяем</div>
            <h2>Сканируем структуру и консистентность компонентов</h2>
            <ul className="rules">
              {rules.map((text, i) => <li key={i}>{text}</li>)}
            </ul>
          </div>
          <StatusBar
            status={status}
            totals={autosummed}
            filter={filter}
            onClickError={() => toggleCounter('error')}
            onClickWarn={() => toggleCounter('warn')}
            onClickInfo={() => toggleCounter('info')}
            onClickTotal={toggleAll}
          />
        </div>

        {status === 'scanning' && (
          <div className="panel notice" role="status" aria-live="polite">
            <Spinner />
            <div className="notice__text">
              <div className="eyebrow">Сканирование</div>
              <div>Проходим по документу и компонентам… Это может занять несколько секунд.</div>
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

        {/* Логи разработчика
        <div className="devlog">
          <button className="devlog__toggle" onClick={() => setShowLog(s => !s)}>
            {showLog ? 'Скрыть лог' : 'Показать лог'}
          </button>
          {showLog && (
            <div className="devlog__panel">
              <div className="devlog__actions">
                <button onClick={() => copyText(logs.join('\n'))}>Copy log</button>
                <button onClick={() => setLogs([])}>Clear</button>
              </div>
              <pre className="devlog__pre">{logs.join('\n')}</pre>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
}
