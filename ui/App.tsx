import React, { useCallback, useMemo, useState } from 'react';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import Results from './components/Results';
import Spinner from './components/Spinner';
import QuickFilters, { type RuleFilter } from './components/QuickFilters';
import { groupByPageAndComponent } from './lib/utils/grouping';
import { translations, type Lang, type Translation } from './lib/i18n/translations';
import type { RuleDefinition, RuleMetadata } from './lib/types';
import { copyText } from './lib/utils/copy';
import { initialTotals } from './lib/plugin/types';
import type { Totals } from './lib/types';
import { usePluginMessages } from './lib/hooks/usePluginMessages';
import './styles.scss';

export default function App() {
  const { status, setStatus, results, setResults, totals, setTotals, rules } = usePluginMessages(initialTotals);
  const [filter, setFilter] = useState({ error: true, warn: true, info: true });
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>({ duplicate: true, mixed: true, instance: true });
  const browserLang = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  const [lang, setLang] = useState<Lang>(browserLang.startsWith('ru') ? 'ru' : 'en');
  const t: Translation = translations[lang];

  const rulesById = useMemo(() => {
    const entries: Array<[string, RuleDefinition]> = rules.map((r) => [r.id, r]);
    return new Map(entries);
  }, [rules]);

  const fallbackMeta = useCallback((ruleId?: string): RuleMetadata => {
    const category =
      ruleId === 'component-true-duplicate' || ruleId === 'component-structural-duplicate' ? 'duplicate'
      : ruleId === 'text-mixed-font-family' || ruleId === 'text-mixed-color-or-decoration' ? 'mixed'
      : ruleId === 'instance-size-override' || ruleId === 'instance-detached' ? 'instance'
      : 'other';
    const priority =
      category === 'duplicate' ? 0
      : category === 'mixed' ? 1
      : category === 'instance' ? 2
      : 3;
    return { category, priority, labels: [category] };
  }, []);

  const getRuleMeta = useCallback((ruleId?: string): RuleMetadata => {
    if (!ruleId) return fallbackMeta(ruleId);
    const def = rulesById.get(ruleId);
    if (def?.metadata) return def.metadata;
    return fallbackMeta(ruleId);
  }, [rulesById, fallbackMeta]);

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

      const { category } = getRuleMeta(r.ruleId);
      const byRule =
        category === 'duplicate' ? ruleFilter.duplicate
        : category === 'mixed' ? ruleFilter.mixed
        : category === 'instance' ? ruleFilter.instance
        : true;

      return bySeverity && byRule;
    });
  }, [results, filter, ruleFilter, getRuleMeta]);

  const ordered = useMemo(() => {
    return filtered
      .map((item, idx) => ({ item, idx }))
      .sort((a, b) => {
        const pa = getRuleMeta(a.item.ruleId).priority;
        const pb = getRuleMeta(b.item.ruleId).priority;
        if (pa !== pb) return pa - pb;
        return a.idx - b.idx; // стабильность внутри rule
      })
      .map(({ item }) => item);
  }, [filtered, getRuleMeta]);

  const grouped = useMemo(() => groupByPageAndComponent(ordered), [ordered]);

  const toggleCounter = (key: 'error' | 'warn' | 'info') =>
    setFilter((f) => ({ ...f, [key]: !f[key] }));

  const toggleAll = () =>
    setFilter((f) => {
      const allOn = f.error && f.warn && f.info;
      return allOn ? { error: false, warn: false, info: false } : { error: true, warn: true, info: true };
    });

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
              statusScanningLong: t.statusScanningLong,
              statusCompleted: t.statusCompleted,
              statusError: t.statusError,
              statusErrorLong: t.statusErrorLong,
            }}
          />
        </div>

        <QuickFilters
          filter={ruleFilter}
          disabled={status === 'scanning'}
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
        {status === 'error' && (
          <div className="panel notice notice--error" role="status" aria-live="assertive">
            <div className="notice__text">
              <div className="eyebrow">{t.statusError}</div>
              <div>{t.statusErrorLong}</div>
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
          onHighlight={onHighlight}
          isEmpty={!filtered.length}
          isLoading={status === 'scanning'}
          rulesById={rulesById}
          ruleI18n={{
            titles: t.ruleTitles,
            messages: t.ruleMessages,
            levels: t.lintLevels,
          }}
          labels={{
            empty: t.empty,
            found: t.found,
            show: t.show,
            severityHint: t.severity,
            errors: t.errors,
            warns: t.warns,
            info: t.info,
            scanningTitle: t.scanningTitle,
            scanningDesc: t.scanningDesc,
          }}
        />
      </div>
    </div>
  );
}
