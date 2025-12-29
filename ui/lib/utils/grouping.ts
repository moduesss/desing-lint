import type { Finding } from '../types';

export type ComponentGroup = { name: string; findings: Finding[] };
export type PageGroup = { page: string; components: ComponentGroup[] };

export function groupByPageAndComponent(list: Finding[]): PageGroup[] {
  const pages = new Map<string, Map<string, Finding[]>>();

  const componentLabel = (finding: Finding): string => {
    if (finding.component) return finding.component;
    if (finding.path) {
      const parts = finding.path.split(' / ').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) return last;
    }
    return 'Без компонента';
  };

  for (const f of list) {
    const page = (f.page || 'Без страницы').trim();
    const component = componentLabel(f);
    if (!pages.has(page)) pages.set(page, new Map());
    const comps = pages.get(page)!;
    if (!comps.has(component)) comps.set(component, []);
    comps.get(component)!.push(f);
  }

  return Array.from(pages.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, comps]) => ({
      page,
      components: Array.from(comps.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, findings]) => ({ name, findings })),
    }));
}
