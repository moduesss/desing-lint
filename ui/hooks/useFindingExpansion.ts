import { useCallback, useState } from 'react';

export function useFindingExpansion() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isExpanded = useCallback((id: string) => !!expanded[id], [expanded]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const reset = useCallback((ids?: string[]) => {
    if (!ids || !ids.length) {
      setExpanded({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const id of ids) next[id] = false;
    setExpanded(next);
  }, []);

  return { expanded, isExpanded, toggle, reset };
}

