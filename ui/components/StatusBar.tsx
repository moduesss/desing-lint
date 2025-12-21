import React from 'react';

type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
type Totals = { total: number; errors: number; warns: number; infos: number };

type Props = {
  status: ScanStatus;
  totals: Totals;
  filter: { error: boolean; warn: boolean; info: boolean };
  onClickTotal: () => void;
  onClickError: () => void;
  onClickWarn: () => void;
  onClickInfo: () => void;
  labels: {
    total: string;
    errors: string;
    warns: string;
    info: string;
    statusIdle: string;
    statusScanning: string;
    statusCompleted: string;
    statusError: string;
  };
};

export default function StatusBar({
  status,
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
        <strong>{labels.total}</strong>
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
      <div className="statusbar__right">
        {status === 'idle' && <span>{labels.statusIdle}</span>}
        {status === 'scanning' && <span>{labels.statusScanning}</span>}
        {status === 'completed' && <span>{labels.statusCompleted}</span>}
        {status === 'error' && <span style={{ color: '#c00' }}>{labels.statusError}</span>}
      </div>
    </div>
  );
}
