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
};

export default function StatusBar({
  status,
  totals,
  filter,
  onClickTotal,
  onClickError,
  onClickWarn,
  onClickInfo,
}: Props) {
  return (
    <div className="statusbar">
      <div className="statusbar__left">
        <strong>Всего:</strong>
        <button className="pill" onClick={onClickTotal} aria-pressed={filter.error && filter.warn && filter.info}>
          {totals.total}
        </button>
        <button className={`pill pill--err ${filter.error ? '' : 'pill--off'}`} onClick={onClickError}>
          {totals.errors} errors
        </button>
        <button className={`pill pill--warn ${filter.warn ? '' : 'pill--off'}`} onClick={onClickWarn}>
          {totals.warns} warns
        </button>
        <button className={`pill pill--info ${filter.info ? '' : 'pill--off'}`} onClick={onClickInfo}>
          {totals.infos} info
        </button>
      </div>
      <div className="statusbar__right">
        {status === 'idle' && <span>Ничего не найдено. Нажми Run Scan.</span>}
        {status === 'scanning' && <span>Scanning…</span>}
        {status === 'completed' && <span>Completed</span>}
        {status === 'error' && <span style={{ color: '#c00' }}>Error</span>}
      </div>
    </div>
  );
}
