import React from 'react';
import type { Translation } from '../lib/i18n/translations';

export type RuleFilter = { duplicate: boolean; mixed: boolean; instance: boolean };

type Props = {
  filter: RuleFilter;
  labels: Pick<Translation, 'quickFilters' | 'filterAll' | 'filterDuplicates' | 'filterMixed' | 'filterInstances'>;
  onToggleAll: () => void;
  onToggle: (key: keyof RuleFilter) => void;
};

export default function QuickFilters({ filter, labels, onToggleAll, onToggle }: Props) {
  const allOn = filter.duplicate && filter.mixed && filter.instance;
  return (
    <div className="panel quickfilters">
      <div className="eyebrow">{labels.quickFilters}</div>
      <div className="quickfilters__row">
        <button
          className={`pill ${allOn ? '' : 'pill--off'}`}
          onClick={onToggleAll}
          type="button"
        >
          {labels.filterAll}
        </button>
        <button
          className={`pill ${filter.duplicate ? '' : 'pill--off'}`}
          onClick={() => onToggle('duplicate')}
          type="button"
        >
          {labels.filterDuplicates}
        </button>
        <button
          className={`pill ${filter.mixed ? '' : 'pill--off'}`}
          onClick={() => onToggle('mixed')}
          type="button"
        >
          {labels.filterMixed}
        </button>
        <button
          className={`pill ${filter.instance ? '' : 'pill--off'}`}
          onClick={() => onToggle('instance')}
          type="button"
        >
          {labels.filterInstances}
        </button>
      </div>
    </div>
  );
}
