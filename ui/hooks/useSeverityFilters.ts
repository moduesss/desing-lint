import { useCallback, useState } from 'react';

export type SeverityFilterState = { error: boolean; warn: boolean; info: boolean };

export function useSeverityFilters(initial: SeverityFilterState = { error: true, warn: true, info: true }) {
  const [filter, setFilter] = useState<SeverityFilterState>(initial);

  const toggleCounter = useCallback((key: keyof SeverityFilterState) => {
    setFilter((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleAll = useCallback(() => {
    setFilter((prev) => {
      const allOn = prev.error && prev.warn && prev.info;
      return allOn ? { error: false, warn: false, info: false } : { error: true, warn: true, info: true };
    });
  }, []);

  return { filter, setFilter, toggleCounter, toggleAll };
}
