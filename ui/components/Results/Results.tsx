import React from 'react';
import Spinner from '../Spinner/Spinner';
import { useFindingExpansion } from '../../hooks/useFindingExpansion';
import type { PageGroup } from '../../lib/utils/grouping';
import type { RuleCopy, RuleMeta } from '../../lib/types';
import type { Translation } from '../../lib/i18n/translations';
import { ComponentSection } from './ComponentSection';
import './Results.scss';

type Props = {
  grouped: PageGroup[];
  onHighlight: (nodeId: string) => void;
  isEmpty: boolean;
  isLoading?: boolean;
  rulesById: Map<string, RuleMeta>;
  ruleCopy: Record<string, RuleCopy>;
  labels: Pick<Translation, 'empty' | 'found' | 'show' | 'errors' | 'warns' | 'info' | 'scanningTitle' | 'scanningDesc' | 'explain' | 'explainHide' | 'rationaleLabel' | 'triggerLabel'> & { severityHint: Translation['severity'] };
};

export default function Results({
  grouped,
  onHighlight,
  isEmpty,
  isLoading,
  rulesById: _rulesById,
  ruleCopy,
  labels,
}: Props) {
  const pages = grouped.map((group) => group.page);
  const [activePage, setActivePage] = React.useState(pages[0] || '');
  const { isExpanded, toggle } = useFindingExpansion();

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

  const activeGroup = grouped.find((group) => group.page === activePage);

  return (
    <div className={`results ${isLoading ? 'results--loading' : ''}`}>
      {isLoading && (
        <div className="results__overlay" aria-live="polite">
          <div className="results__overlay__content">
            <Spinner />
            <div className="results__overlay__text">
              <div className="eyebrow">{labels.scanningTitle}</div>
              <div>{labels.scanningDesc}</div>
            </div>
          </div>
        </div>
      )}
      <div className="page-tabs">
        {grouped.map(({ page, components }) => {
          const count = components.reduce((acc, component) => acc + component.findings.length, 0);
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
        {activeGroup ? (
          <div className="panel" key={activeGroup.page}>
            <div className="component-list">
              {activeGroup.components.map((component) => (
                <ComponentSection
                  key={component.name}
                  group={component}
                  ruleCopy={ruleCopy}
                  labels={labels}
                  isExpanded={isExpanded}
                  onToggle={toggle}
                  onHighlight={onHighlight}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
