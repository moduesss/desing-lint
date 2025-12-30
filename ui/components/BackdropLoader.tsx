import React from 'react';
import Spinner from './Spinner';

type Props = {
  visible: boolean;
  messages: readonly string[];
  title: string;
  desc?: string;
};

export default function BackdropLoader({ visible, messages, title, desc }: Props) {
  if (!visible) return null;

  return (
    <div className="backdrop">
      <div className="backdrop__center">
        <Spinner />
      </div>
      {desc ? <div className="backdrop__hint" aria-live="polite">{desc}</div> : null}
    </div>
  );
}
