import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header/Header';
import StatusBar from './components/StatusBar/StatusBar';
import Results from './components/Results/Results';
import QuickFilters, { type RuleFilter } from './components/QuickFilters/QuickFilters';
import { translations, type Lang, type Translation } from './lib/i18n/translations';
import type { RuleMeta } from './lib/types';
import { copyText } from './lib/utils/copy';
import { initialTotals } from './lib/plugin/types';
import type { Totals } from './lib/types';
import { usePluginMessages } from './lib/hooks/usePluginMessages';
import { ruleCopyByLang } from '../src/i18n/rules';
import BackdropLoader from './components/BackdropLoader/BackdropLoader';
import { useRuleMetaLookup } from './hooks/useRuleMetaLookup';
import { useSeverityFilters } from './hooks/useSeverityFilters';
import { useRuleFilters } from './hooks/useRuleFilters';
import { useFilteredFindings } from './hooks/useFilteredFindings';
import { useGroupedFindings } from './hooks/useGroupedFindings';
import './styles.scss';

export default function App() {
  const { status, setStatus, results, setResults, totals, setTotals, rules } = usePluginMessages(initialTotals);
  const { filter, toggleCounter, toggleAll } = useSeverityFilters();
  const { ruleFilter, toggleRule, toggleRulesAll } = useRuleFilters();
  const [backdropVisible, setBackdropVisible] = useState(false);
  const scanStartRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const browserLang = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  const [lang, setLang] = useState<Lang>(browserLang.startsWith('ru') ? 'ru' : 'en');
  const t: Translation = translations[lang];
  const ruleCopy = ruleCopyByLang[lang];

  const { rulesById, getRuleMeta } = useRuleMetaLookup(rules);

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

  const filtered = useFilteredFindings(results, filter, ruleFilter, getRuleMeta);

  const { grouped } = useGroupedFindings(filtered, getRuleMeta);

  useEffect(() => {
    if (status === 'scanning') {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      scanStartRef.current = Date.now();
      setBackdropVisible(true);
      return;
    }
    const started = scanStartRef.current;
    const elapsed = started ? Date.now() - started : Number.POSITIVE_INFINITY;
    const minVisible = 1500;
    const remaining = minVisible - elapsed;
    if (remaining > 0 && Number.isFinite(remaining)) {
      hideTimerRef.current = window.setTimeout(() => {
        setBackdropVisible(false);
        hideTimerRef.current = null;
      }, remaining);
    } else {
      setBackdropVisible(false);
    }
  }, [status]);

  useEffect(() => () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
  }, []);

  return (
    <div className="app">
      <Header
        onRun={onRun}
        onExport={exportJson}
        onCopySlack={copySlack}
        onCopyJira={copyJira}
        disabled={status === 'scanning'}
        isScanning={status === 'scanning'}
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

        <Results
          grouped={grouped}
          onHighlight={onHighlight}
          isEmpty={!filtered.length}
          isLoading={status === 'scanning'}
          rulesById={rulesById}
          ruleCopy={ruleCopy}
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
            explain: t.explain,
            explainHide: t.explainHide,
            rationaleLabel: t.rationaleLabel,
            triggerLabel: t.triggerLabel,
          }}
        />
      </div>
      <BackdropLoader
        visible={backdropVisible}
        messages={t.scanningOverlayMessages}
        title={t.scanningTitle}
        desc={t.scanningDesc}
      />
    </div>
  );
}
