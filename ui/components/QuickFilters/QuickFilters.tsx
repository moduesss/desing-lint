import React from 'react';
import type { Translation } from '../../lib/i18n';
import './QuickFilters.scss';

export type RuleFilter = { duplicate: boolean; mixed: boolean; instance: boolean };

type Props = {
  filter: RuleFilter;
  disabled?: boolean;
  labels: Pick<Translation, 'quickFilters' | 'filterAll' | 'filterDuplicates' | 'filterMixed' | 'filterInstances'>;
  onToggleAll: () => void;
  onToggle: (key: keyof RuleFilter) => void;
};

export default function QuickFilters({ filter, disabled, labels, onToggleAll, onToggle }: Props) {
  const allOn = filter.duplicate && filter.mixed && filter.instance;
  return (
    <div className={`panel quickfilters ${disabled ? 'quickfilters--disabled' : ''}`}>
      <div className="eyebrow">{labels.quickFilters}</div>
      <div className="quickfilters__row">
        <button
          className={`pill ${allOn ? '' : 'pill--off'}`}
          onClick={onToggleAll}
          disabled={disabled}
          type="button"
        >
          {labels.filterAll}
        </button>
        <button
          className={`pill ${filter.duplicate ? '' : 'pill--off'}`}
          onClick={() => onToggle('duplicate')}
          disabled={disabled}
          type="button"
        >
          {labels.filterDuplicates}
        </button>
        <button
          className={`pill ${filter.mixed ? '' : 'pill--off'}`}
          onClick={() => onToggle('mixed')}
          disabled={disabled}
          type="button"
        >
          {labels.filterMixed}
        </button>
        <button
          className={`pill ${filter.instance ? '' : 'pill--off'}`}
          onClick={() => onToggle('instance')}
          disabled={disabled}
          type="button"
        >
          {labels.filterInstances}
        </button>
      </div>
    </div>
  );
}
