import React from 'react';
import type { Lang } from '../../lib/i18n/translations';
import './Header.scss';

type Props = {
  onRun: () => void;
  onExport: () => void;
  onCopySlack: () => void;
  onCopyJira: () => void;
  disabled?: boolean;
  isScanning: boolean;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  labels: { runScan: string; exportJson: string; copySlack: string; copyJira: string };
};

export default function Header({ onRun, onExport, onCopySlack, onCopyJira, disabled, lang, onLangChange, labels, isScanning }: Props) {
  const [runLabel, setRunLabel] = React.useState(labels.runScan);

  React.useEffect(() => {
    if (!isScanning) {
      setRunLabel(labels.runScan);
      return;
    }
    const base = (labels.runScan || '').replace(/…/g, '').replace(/\.+$/, '').trim() || labels.runScan;
    const frames = ['.', '..', '...'];
    let idx = 0;
    setRunLabel(`${base}${frames[idx]}`);
    const id = window.setInterval(() => {
      idx = (idx + 1) % frames.length;
      setRunLabel(`${base}${frames[idx]}`);
    }, 500);
    return () => window.clearInterval(id);
  }, [isScanning, labels.runScan]);

  return (
    <div className="titlebar">
      <div className="titlebar__head">
        <div className="titlebar__title">
          <span style={{ opacity: 0.9 }}>🧩</span>
          <span>Design Lint</span>
        </div>
        <div className="langswitch">
          <button
            className={`langswitch__btn ${lang === 'en' ? 'langswitch__btn--active' : ''}`}
            onClick={() => onLangChange('en')}
            type="button"
          >
            EN
          </button>
          <button
            className={`langswitch__btn ${lang === 'ru' ? 'langswitch__btn--active' : ''}`}
            onClick={() => onLangChange('ru')}
            type="button"
          >
            RU
          </button>
        </div>
      </div>

      <div className="titlebar__controls">
        <button className="btn btn--primary" onClick={onRun} disabled={disabled}>
          {runLabel}
        </button>
        {/* TODO
          Export
          Jira & Slack Updates
        */}
        {/* <button className="btn" onClick={onExport} disabled={disabled}>{labels.exportJson}</button>
        <button className="btn" onClick={onCopySlack} disabled={disabled}>{labels.copySlack}</button>
        <button className="btn" onClick={onCopyJira} disabled={disabled}>{labels.copyJira}</button> */}
      </div>
    </div>
  );
}
