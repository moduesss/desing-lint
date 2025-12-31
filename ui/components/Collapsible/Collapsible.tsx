import React from 'react';

export default function Collapsible({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  if (!isOpen) {
    return null;
  }
  return <div className="collapsible">{children}</div>;
}
