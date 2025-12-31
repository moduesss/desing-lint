import React from 'react';
import type { ComponentGroup } from '../../lib/utils/grouping';
import type { Finding, RuleCopy } from '../../lib/types';
import type { Lang, Translation } from '../../lib/i18n/translations';
import { FindingItem } from './FindingItem';

type Props = {
  group: ComponentGroup;
  ruleCopy: Record<string, RuleCopy>;
  labels: Pick<
    Translation,
    'found'
    | 'errors'
    | 'warns'
    | 'info'
    | 'show'
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
  > & { severityHint: Translation['severity'] };
  lang: Lang;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
  onHighlight: (nodeId: string) => void;
};

function ComponentHeader({ name, findings, items, labels }: { name: string; findings: number; items: Finding[]; labels: { found: string; errors: string; warns: string; info: string } }) {
  const stats = items.reduce(
    (acc, finding) => {
      acc[finding.severity as 'error' | 'warn' | 'info']++;
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

export function ComponentSection({ group, ruleCopy, labels, lang, isExpanded, onToggle, onHighlight }: Props) {
  return (
    <div className="component">
      <ComponentHeader
        name={group.name}
        findings={group.findings.length}
        items={group.findings}
        labels={{ found: labels.found, errors: labels.errors, warns: labels.warns, info: labels.info }}
      />
      <ul className="component__findings">
        {group.findings.map((finding) => (
          <FindingItem
            key={finding.id}
            finding={finding}
            copy={ruleCopy[finding.ruleId]}
            labels={{
              show: labels.show,
              explainWhy: labels.explainWhy,
              explainHide: labels.explainHide,
              explainWhyTitle: labels.explainWhyTitle,
              explainWhenTitle: labels.explainWhenTitle,
              copy: labels.copy,
              copySlack: labels.copySlack,
              copyJira: labels.copyJira,
              copied: labels.copied,
              copyError: labels.copyError,
              copyFailed: labels.copyFailed,
              severity: labels.severityHint,
            }}
            lang={lang}
            isExpanded={isExpanded(finding.id)}
            onToggle={() => onToggle(finding.id)}
            onHighlight={onHighlight}
          />
        ))}
      </ul>
    </div>
  );
}
