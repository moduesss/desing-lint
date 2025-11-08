import React from 'react';

type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
type Totals = { total: number; errors: number; warns: number; infos: number };

const ChipBtn = ({
  label,
  active = true,
  onClick,
  className = '',
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    className={`badge ${!active ? 'badge--muted' : ''} ${className}`}
    onClick={onClick}
    aria-pressed={active}
    type="button"
  >
    {label}
  </button>
);

export default function StatusBar({
  status,
  totals,
  filter,
  onClickTotal,
  onClickError,
  onClickWarn,
  onClickInfo,
}: {
  status: ScanStatus;
  totals: Totals;
  filter: { error: boolean; warn: boolean; info: boolean };
  onClickTotal: () => void;
  onClickError: () => void;
  onClickWarn: () => void;
  onClickInfo: () => void;
}) {
  return (
    <div className="statusbar">
      <div style={{ fontWeight: 600 }}>
        {status === 'idle' && 'Idle'}
        {status === 'scanning' && 'Scanning…'}
        {status === 'completed' && 'Completed'}
        {status === 'error' && 'Error'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ChipBtn label={`Всего: ${totals.total}`} onClick={onClickTotal} />
        <ChipBtn className="badge--rose"  label={`${totals.errors} errors`} active={filter.error} onClick={onClickError} />
        <ChipBtn className="badge--amber" label={`${totals.warns} warns`}  active={filter.warn}  onClick={onClickWarn} />
        <ChipBtn label={`${totals.infos} info`} active={filter.info} onClick={onClickInfo} />
      </div>
    </div>
  );
}
