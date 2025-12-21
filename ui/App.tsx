import React, { useMemo, useState } from 'react';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import Results from './components/Results';
import Spinner from './components/Spinner';
import QuickFilters, { type RuleFilter } from './components/QuickFilters';
import { groupByPageAndComponent } from './lib/utils/grouping';
import { translations, type Lang, type Translation } from './lib/i18n/translations';
import type { Finding } from './lib/types';
import { copyText } from './lib/utils/copy';
import { initialTotals, type Totals } from './lib/plugin/types';
import { usePluginMessages } from './lib/hooks/usePluginMessages';
import './styles.scss';

export default function App() {
  const { status, setStatus, results, setResults, totals, setTotals } = usePluginMessages(initialTotals);
  const [filter, setFilter] = useState({ error: true, warn: true, info: true });
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>({ duplicate: true, mixed: true, instance: true });
  const [collapsedPages, setCollapsedPages] = useState<Record<string, boolean>>({});
  const browserLang = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  const [lang, setLang] = useState<Lang>(browserLang.startsWith('ru') ? 'ru' : 'en');
  const t: Translation = translations[lang];

  // сбрасываем свёрнутые страницы при каждом новом результате
  React.useEffect(() => {
    setCollapsedPages({});
  }, [results]);

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
    copyText(lines.join('\n'), t.copyFail);
  };

  const copyJira = () => {
    const md = results
      .map((r) => `- [${r.severity}] ${r.message}${r.path ? ` \`(${r.path})\`` : ''}`)
      .join('\n');
    copyText(md, t.copyFail);
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
    return results.filter((r) => {
      const bySeverity =
        (r.severity === 'error' && filter.error) ||
        (r.severity === 'warn' && filter.warn) ||
        (r.severity === 'info' && filter.info);

      const rule = (r as any).rule as string | undefined;
      const ruleKey =
        rule === 'duplicate' ? 'duplicate'
        : rule === 'mixed-style' ? 'mixed'
        : rule === 'instance-size' || rule === 'instance-detached' ? 'instance'
        : 'other';
      const byRule =
        ruleKey === 'other' ? true
        : ruleKey === 'duplicate' ? ruleFilter.duplicate
        : ruleKey === 'mixed' ? ruleFilter.mixed
        : ruleFilter.instance;

      return bySeverity && byRule;
    });
  }, [results, filter, ruleFilter]);

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

  const toggleRule = (key: keyof RuleFilter) =>
    setRuleFilter((f) => ({ ...f, [key]: !f[key] }));

  const toggleRulesAll = () => {
    const allOn = ruleFilter.duplicate && ruleFilter.mixed && ruleFilter.instance;
    setRuleFilter(allOn ? { duplicate: false, mixed: false, instance: false } : { duplicate: true, mixed: true, instance: true });
  };

  return (
    <div className="app">
      <Header
        onRun={onRun}
        onExport={exportJson}
        onCopySlack={copySlack}
        onCopyJira={copyJira}
        disabled={status === 'scanning'}
        lang={lang}
        onLangChange={setLang}
        labels={{
          runScan: status === 'scanning' ? t.scanning : t.runScan,
          exportJson: t.exportJson,
          copySlack: t.copySlack,
          copyJira: t.copyJira,
        }}
      />

      <div className="canvas">
        <div className="panel intro">
          <div>
            <div className="eyebrow">{t.what}</div>
            <h2>{t.hero}</h2>
            <ul className="rules">
              {t.rules.map((text: string, i: number) => <li key={i}>{text}</li>)}
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
            labels={{
              totals: t.totals,
              errors: t.errors,
              warns: t.warns,
              info: t.info,
              statusIdle: t.statusIdle,
              statusScanning: t.statusScanning,
              statusCompleted: t.statusCompleted,
              statusError: t.statusError,
            }}
          />
        </div>

        <QuickFilters
          filter={ruleFilter}
          onToggleAll={toggleRulesAll}
          onToggle={toggleRule}
          labels={{
            quickFilters: t.quickFilters,
            filterAll: t.filterAll,
            filterDuplicates: t.filterDuplicates,
            filterMixed: t.filterMixed,
            filterInstances: t.filterInstances,
          }}
        />

        {status === 'scanning' && (
          <div className="panel notice" role="status" aria-live="polite">
            <Spinner />
            <div className="notice__text">
              <div className="eyebrow">{t.scanningTitle}</div>
              <div>{t.scanningDesc}</div>
            </div>
          </div>
        )}

        <div className="panel docs">
          <div className="eyebrow">{t.docsTitle}</div>
          <ul className="rules rules--compact">
            {t.docs.map((text: string, i: number) => <li key={i}>{text}</li>)}
          </ul>
        </div>

        <Results
          grouped={grouped}
          collapsedPages={collapsedPages}
          onTogglePage={togglePage}
          onHighlight={onHighlight}
          isEmpty={!filtered.length}
          labels={{
            empty: t.empty,
            found: t.found,
            show: t.show,
            severityHint: t.severity,
            errors: t.errors,
            warns: t.warns,
            info: t.info,
          }}
        />
      </div>
    </div>
  );
}
