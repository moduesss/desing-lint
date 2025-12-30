import React from 'react';
import type { PageGroup } from '../lib/utils/grouping';
import type { Finding, RuleCopy, RuleMeta, Severity } from '../lib/types';
import type { Translation } from '../lib/i18n/translations';

type Props = {
  grouped: PageGroup[];
  onHighlight: (nodeId: string) => void;
  isEmpty: boolean;
  isLoading?: boolean;
  rulesById: Map<string, RuleMeta>;
  ruleCopy: Record<string, RuleCopy>;
  levelLabels: Record<string, string>;
  labels: Pick<Translation, 'empty' | 'found' | 'show' | 'errors' | 'warns' | 'info' | 'scanningTitle' | 'scanningDesc'> & { severityHint: Translation['severity'] };
};

function ComponentHeader({
  name,
  findings,
  items,
  labels,
}: {
  name: string;
  findings: number;
  items: Finding[];
  labels: { found: string; errors: string; warns: string; info: string };
}) {
  const stats = items.reduce(
    (acc, f) => {
      acc[f.severity as 'error' | 'warn' | 'info']++;
      return acc;
    },
    { error: 0, warn: 0, info: 0 }
  );

  return (
    <div className="component__header">
      <div>
        <div className="component__title">{name}</div>
        <div className="component__count">{labels.found}: {findings}</div>
      </div>
      <div className="component__stats">
        {stats.error ? <span className="chip chip--rose">{stats.error} {labels.errors}</span> : null}
        {stats.warn ? <span className="chip chip--amber">{stats.warn} {labels.warns}</span> : null}
        {stats.info ? <span className="chip chip--muted">{stats.info} {labels.info}</span> : null}
      </div>
    </div>
  );
}

function formatRuleMessage(
  finding: Finding,
  copy?: RuleCopy
): string {
  const template = copy?.message;
  if (!template) return finding.message;
  if (template.includes('{{component}}') && !finding.component) return finding.message;
  return template.replace(/{{\s*component\s*}}/g, finding.component || '');
}

function truncateBadge(text: string, limit = 128): string {
  if (text.length <= limit) return text;
  const cut = limit > 3 ? limit - 3 : limit;
  return `${text.slice(0, cut)}...`;
}

export default function Results({
  grouped,
  onHighlight,
  isEmpty,
  isLoading,
  rulesById,
  ruleCopy,
  levelLabels,
  labels,
}: Props) {
  const pages = grouped.map(group => group.page);
  const [activePage, setActivePage] = React.useState(pages[0] || '');

  React.useEffect(() => {
    if (!pages.length) {
      setActivePage('');
      return;
    }
    if (!pages.includes(activePage)) {
      setActivePage(pages[0]);
    }
  }, [pages, activePage]);

  if (isEmpty) {
    return (
      <div className="empty">
        {labels.empty}
      </div>
    );
  }

  return (
    <div className={`results ${isLoading ? 'results--loading' : ''}`}>
      {isLoading && (
        <div className="results__overlay" aria-live="polite">
          <div className="results__overlay__content">
            <div className="spinner" />
            <div className="results__overlay__text">
              <div className="eyebrow">{labels.scanningTitle}</div>
              <div>{labels.scanningDesc}</div>
            </div>
          </div>
        </div>
      )}
      <div className="page-tabs">
        {grouped.map(({ page, components }) => {
          const count = components.reduce((acc, c) => acc + c.findings.length, 0);
          const isActive = page === activePage;
          return (
            <button
              key={page}
              className={`page-tab ${isActive ? 'page-tab--active' : ''}`}
              onClick={() => setActivePage(page)}
              type="button"
            >
              <span className="chev" style={{ transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
              <span className="page-tab__title">{page}</span>
              <span className="badge">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="stack">
        {(grouped.find(group => group.page === activePage) ? [grouped.find(group => group.page === activePage)!] : []).map(({ page, components }) => (
          <div key={page} className="panel">
            <div className="component-list">
              {components.map((group) => (
                <div key={group.name} className="component">
                  <ComponentHeader
                    name={group.name}
                    findings={group.findings.length}
                    items={group.findings}
                    labels={{ found: labels.found, errors: labels.errors, warns: labels.warns, info: labels.info }}
                  />
                  <ul className="component__findings">
                    {group.findings.map((f) => {
                      const sevClass =
                        f.severity === 'error' ? 'badge badge--rose'
                        : f.severity === 'warn' ? 'badge badge--amber'
                        : 'badge';
                      const rule = rulesById.get(f.ruleId);
                      const copy = ruleCopy[f.ruleId];
                      const ruleTitle = copy?.title || rule?.id || f.ruleId;
                      const ruleLevel = f.level;
                      const ruleLevelLabel = levelLabels[ruleLevel] || ruleLevel;
                      const severityKey: Severity = f.severity;
                      const hintParts = [ruleTitle, labels.severityHint[severityKey]];
                      const message = formatRuleMessage(f, copy);
                      const pathLabel = f.path ? truncateBadge(f.path) : null;
                      const items: NonNullable<Finding['items']> = f.items ?? [];

                      return (
                        <li key={f.id} className="result__line">
                          <div className="result__body">
                            <div className="result__title">{message}</div>
                            <div className="result__hint">{hintParts.join(' · ')}</div>
                            <div className="result__meta">
                              {pathLabel ? <span className="badge badge--muted">{pathLabel}</span> : null}
                              {ruleLevel ? <span className="badge badge--muted">{ruleLevelLabel}</span> : null}
                              <span className={sevClass}>{f.severity}</span>
                            </div>
                            {items.length ? (
                              <div className="result__items">
                                {items.map((item: NonNullable<Finding['items']>[number]) => (
                                  <div key={item.nodeId} className="result__item">
                                    <span className="badge badge--muted">{truncateBadge(item.label)}</span>
                                    <button
                                      className="btn btn--ghost"
                                      onClick={() => onHighlight(item.nodeId)}
                                    >
                                      {labels.show}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          {f.nodeId && !items.length ? (
                            <button className="btn btn--ghost" onClick={() => onHighlight(f.nodeId as string)}>
                              {labels.show}
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
