import React from 'react';
import type { Finding, RuleCopy } from '../../lib/types';
import type { Lang, Translation } from '../../lib/i18n/translations';
import { copyToClipboard } from '../../lib/utils/copy';
import { formatJiraFinding, formatSlackFinding } from '../../lib/utils/exportFormats';
import { formatRuleMessage, truncateBadge } from './utils';

type Props = {
  finding: Finding;
  copy?: RuleCopy;
  labels: Pick<
    Translation,
    'show'
    | 'explainWhy'
    | 'explainHide'
    | 'explainWhyTitle'
    | 'explainWhenTitle'
    | 'copy'
    | 'copySlack'
    | 'copyJira'
    | 'copied'
    | 'copyError'
    | 'copyFailed'
  > & { severity: Translation['severity'] };
  lang: Lang;
  isExpanded: boolean;
  onToggle: () => void;
  onHighlight: (nodeId: string) => void;
};

export function FindingItem({ finding, copy, labels, lang, isExpanded, onToggle, onHighlight }: Props) {
  const [copyNotice, setCopyNotice] = React.useState<{ text: string; isError: boolean } | null>(null);
  const copyTimeoutRef = React.useRef<number | null>(null);
  const [copyLabel, setCopyLabel] = React.useState<string>(labels.copy);

  const severityClass =
    finding.severity === 'error' ? 'badge badge--rose'
    : finding.severity === 'warn' ? 'badge badge--amber'
    : 'badge';

  const severityLabel = labels.severity[finding.severity] || finding.severity;
  const message = formatRuleMessage(finding, copy);
  const description = copy?.description || '';
  const items: NonNullable<Finding['items']> = finding.items ?? [];
  const tooltip = items[0]?.path || finding.path || '';

  const showCopyNotice = (ok: boolean) => {
    setCopyNotice({ text: ok ? labels.copied : labels.copyError, isError: !ok });
    setCopyLabel(ok ? labels.copied : labels.copyError);
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyNotice(null);
      setCopyLabel(labels.copy);
      copyTimeoutRef.current = null;
    }, 1600);
  };

  const handleCopy = async (kind: 'slack' | 'jira') => {
    const text = kind === 'slack'
      ? formatSlackFinding({ finding, ruleCopy: copy, severityLabel, lang })
      : formatJiraFinding({ finding, ruleCopy: copy, severityLabel, lang });
    const ok = await copyToClipboard(text, labels.copyFailed);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn('[Design Lint] copy failed');
    }
    showCopyNotice(ok);
  };

  React.useEffect(() => {
    setCopyLabel(labels.copy);
  }, [labels.copy]);

  React.useEffect(() => () => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
  }, []);

  return (
    <li className="result__line">
      <div className="result__body">
        <div className="result__title">{message}</div>
        {description ? <div className="result__description">{description}</div> : null}
        <div className="result__meta">
          <span className={severityClass}>{finding.severity}</span>
        </div>
        <div className="result__actions">
          <div className='primary'>
            <button
              type="button"
              className="btn btn--subtle result__toggle-btn"
              onClick={onToggle}
              >
              {isExpanded ? labels.explainHide : labels.explainWhy}
            </button>
          </div>
          <div className="result__actions-right">
            <div className="result__copy">
              <button
                type="button"
                className={`btn btn--ghost btn--mini${copyNotice ? (copyNotice.isError ? ' btn--copy-error' : ' btn--copy-success') : ''}`}
                >
                {copyLabel}
              </button>
              <div className="result__copy-menu" role="menu">
                <button
                  type="button"
                  className="result__copy-item"
                  title={labels.copySlack}
                  aria-label={labels.copySlack}
                  onClick={() => handleCopy('slack')}
                  >
                  Slack
                </button>
                <button
                  type="button"
                  className="result__copy-item"
                  title={labels.copyJira}
                  aria-label={labels.copyJira}
                  onClick={() => handleCopy('jira')}
                  >
                  Jira
                </button>
              </div>
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
          </div>
        </div>
        {isExpanded && copy ? (
          <div className="result__details">
            <div className="result__details__item">
              <div className="result__details__label">{labels.explainWhyTitle}</div>
              <div className="result__details__text">{copy.rationale}</div>
            </div>
            <div className="result__details__item">
              <div className="result__details__label">{labels.explainWhenTitle}</div>
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
                  title={item.path || finding.path || tooltip || undefined}
                  onClick={() => onHighlight(item.nodeId)}
                >
                  {labels.show}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
