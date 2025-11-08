import type { Finding } from './types';

export function groupByPage(list: Finding[]) {
  const map: Record<string, Finding[]> = {};
  for (const f of list) {
    // пытаемся извлечь «Page / path / …» → берём первый сегмент
    const page =
      (f.path?.split(' / ')[0] || 'Unknown Page').trim();
    if (!map[page]) map[page] = [];
    map[page].push(f);
  }
  // стабильная сортировка страниц — по имени
  const sorted: Record<string, Finding[]> = {};
  for (const key of Object.keys(map).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = map[key];
  }
  return sorted;
}
