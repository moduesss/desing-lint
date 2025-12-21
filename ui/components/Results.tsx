import React from 'react';
import Collapsible from './collaps/Collapsible';
import type { PageGroup } from '../lib/grouping';
import type { Finding } from '../lib/types';

type Props = {
  grouped: PageGroup[];
  collapsedPages: Record<string, boolean>;
  onTogglePage: (page: string) => void;
  onHighlight: (nodeId: string) => void;
  isEmpty: boolean;
  labels: {
    empty: string;
    found: string;
    show: string;
    severityHint: Record<string, string>;
    errors: string;
    warns: string;
    info: string;
  };
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

export default function Results({ grouped, collapsedPages, onTogglePage, onHighlight, isEmpty, labels }: Props) {
  if (isEmpty) {
    return (
      <div className="empty">
        {labels.empty}
      </div>
    );
  }

  return (
    <div className="results">
      <div className="stack">
        {grouped.map(({ page, components }) => {
          const count = components.reduce((acc, c) => acc + c.findings.length, 0);
          const isCollapsed = !!collapsedPages[page];

          return (
            <div key={page} className="panel">
              <button
                className="section"
                onClick={() => onTogglePage(page)}
                aria-expanded={!isCollapsed}
                type="button"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chev" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>▶</span>
                  <span style={{ fontWeight: 600 }}>{page}</span>
                </div>
                <div>
                  <span className="badge">{count}</span>
                </div>
              </button>

              <Collapsible isOpen={!isCollapsed}>
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

                          return (
                            <li key={f.id} className="result__line">
                              <div className="result__body">
                                <div className="result__title">{f.message}</div>
                                <div className="result__hint">{labels.severityHint[f.severity]}</div>
                                <div className="result__meta">
                                  {f.path ? <span className="badge badge--muted">{f.path}</span> : null}
                                  <span className={sevClass}>{f.severity}</span>
                                </div>
                              </div>
                              {f.nodeId && (
                                <button className="btn btn--ghost" onClick={() => onHighlight(f.nodeId)}>
                                  {labels.show}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </div>
  );
}
