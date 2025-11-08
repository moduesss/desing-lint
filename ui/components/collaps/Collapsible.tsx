import React from 'react';

export default function Collapsible({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="collapsible" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
      <div className="collapsible__body">
        {children}
      </div>
    </div>
  );
}
