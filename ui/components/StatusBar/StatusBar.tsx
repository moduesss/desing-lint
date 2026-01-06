import React from 'react';
import type { Translation } from '../../lib/i18n';
import './StatusBar.scss';
type Totals = { total: number; errors: number; warns: number; infos: number };

type Props = {
  totals: Totals;
  filter: { error: boolean; warn: boolean; info: boolean };
  onClickTotal: () => void;
  onClickError: () => void;
  onClickWarn: () => void;
  onClickInfo: () => void;
  labels: Pick<Translation, 'totals' | 'errors' | 'warns' | 'info'>;
};

export default function StatusBar({
  totals,
  filter,
  onClickTotal,
  onClickError,
  onClickWarn,
  onClickInfo,
  labels,
}: Props) {
  return (
    <div className="statusbar">
      <div className="statusbar__left">
        <strong>{labels.totals}</strong>
        <button className="pill" onClick={onClickTotal} aria-pressed={filter.error && filter.warn && filter.info}>
          {totals.total}
        </button>
        <button className={`pill pill--err ${filter.error ? '' : 'pill--off'}`} onClick={onClickError}>
          {totals.errors} {labels.errors}
        </button>
        <button className={`pill pill--warn ${filter.warn ? '' : 'pill--off'}`} onClick={onClickWarn}>
          {totals.warns} {labels.warns}
        </button>
        <button className={`pill pill--info ${filter.info ? '' : 'pill--off'}`} onClick={onClickInfo}>
          {totals.infos} {labels.info}
        </button>
      </div>
    </div>
  );
}
