import React from 'react';

type Props = {
  onRun: () => void;
  onExport: () => void;
  onCopySlack: () => void;
  onCopyJira: () => void;
  disabled?: boolean;
};

export default function Header({ onRun, onExport, onCopySlack, onCopyJira, disabled }: Props) {
  return (
    <div className="titlebar">
      <div className="titlebar__title">
        <span style={{ opacity: 0.9 }}>🧩</span>
        <span>Design Lint</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        <button className="btn btn--primary" onClick={onRun} disabled={disabled}>
          {disabled ? 'Scanning…' : 'Run Scan'}
        </button>
        <button className="btn" onClick={onExport} disabled={disabled}>Export JSON</button>
        <button className="btn" onClick={onCopySlack} disabled={disabled}>Copy Slack</button>
        <button className="btn" onClick={onCopyJira} disabled={disabled}>Copy Jira</button>
      </div>
    </div>
  );
}
