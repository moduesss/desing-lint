import React from 'react';
import type { Finding } from '../lib/types';
import Collapsible from './collaps/Collapsible';

export type GroupedByPage = Record<string, Finding[]>;

export default function Results({
  grouped,
  collapsedPages,
  onTogglePage,
  onHighlight,
  isEmpty,
}: {
  grouped: GroupedByPage;
  collapsedPages: Record<string, boolean>;
  onTogglePage: (page: string) => void;
  onHighlight: (nodeId: string) => void;
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return (
      <div className="empty">
        Ничего не найдено. Нажми <strong>Run Scan</strong>.
      </div>
    );
  }

  const pages = Object.keys(grouped);

  return (
    <div className="results">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pages.map((page) => {
          const list = grouped[page]!;
          const count = list.length;
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
                <ul>
                  {list.map((f) => {
                    const comp = (f as { component?: string }).component;
                    const sevClass =
                      f.severity === 'error' ? 'badge badge--rose'
                      : f.severity === 'warn' ? 'badge badge--amber'
                      : 'badge';

                    return (
                      <li key={f.id} className="result__line">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <div className="result__title">{f.message}</div>
                            <div className="result__meta">
                              {comp ? <span className="badge">COMPONENT • {comp}</span> : null}
                              {f.path ? <span className="badge">{f.path}</span> : null}
                              <span className={sevClass} style={{ textTransform: 'uppercase' }}>{f.severity}</span>
                            </div>
                          </div>
                          {f.nodeId && (
                            <button className="btn" onClick={() => onHighlight(f.nodeId!)}>
                              Show
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </div>
  );
}
