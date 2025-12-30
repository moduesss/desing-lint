import React from 'react';
import type { Finding, RuleCopy } from '../../lib/types';
import type { Translation } from '../../lib/i18n/translations';
import { formatRuleMessage, truncateBadge } from './utils';

type Props = {
  finding: Finding;
  copy?: RuleCopy;
  labels: Pick<Translation, 'show' | 'explain' | 'explainHide' | 'rationaleLabel' | 'triggerLabel'>;
  isExpanded: boolean;
  onToggle: () => void;
  onHighlight: (nodeId: string) => void;
};

export function FindingItem({ finding, copy, labels, isExpanded, onToggle, onHighlight }: Props) {
  const severityClass =
    finding.severity === 'error' ? 'badge badge--rose'
    : finding.severity === 'warn' ? 'badge badge--amber'
    : 'badge';

  const message = formatRuleMessage(finding, copy);
  const description = copy?.description || '';
  const items: NonNullable<Finding['items']> = finding.items ?? [];
  const tooltip = items[0]?.path || finding.path || '';

  return (
    <li className="result__line">
      <div className="result__body">
        <div className="result__title">{message}</div>
        {description ? <div className="result__description">{description}</div> : null}
        <div className="result__meta">
          <span className={severityClass}>{finding.severity}</span>
        </div>
        <button
          type="button"
          className="btn btn--subtle result__toggle-btn"
          onClick={onToggle}
        >
          {isExpanded ? labels.explainHide : labels.explain}
        </button>
        {isExpanded && copy ? (
          <div className="result__details">
            <div className="result__details__item">
              <div className="result__details__label">{labels.rationaleLabel}</div>
              <div className="result__details__text">{copy.rationale}</div>
            </div>
            <div className="result__details__item">
              <div className="result__details__label">{labels.triggerLabel}</div>
              <div className="result__details__text">{copy.whenTriggered}</div>
            </div>
          </div>
        ) : null}
        {items.length ? (
          <div className="result__items">
            {items.map((item) => (
              <div key={item.nodeId} className="result__item">
                <span className="badge badge--muted">{truncateBadge(item.label)}</span>
                <button
                  className="btn btn--ghost"
                  title={item.path || tooltip || undefined}
                  onClick={() => onHighlight(item.nodeId)}
                >
                  {labels.show}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {finding.nodeId && !items.length ? (
        <button
          className="btn btn--ghost"
          title={tooltip || undefined}
          onClick={() => onHighlight(finding.nodeId as string)}
        >
          {labels.show}
        </button>
      ) : null}
    </li>
  );
}
