// src/code.ts
// Главный процесс плагина (Figma plugin main)
import uiHtml from '../dist/ui.html'

type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
type Severity = 'error' | 'warn' | 'info';

type Finding = {
  id: string;
  severity: Severity;
  message: string;
  rule?: 'duplicate' | 'mixed-style' | 'instance-size' | 'instance-detached';
  path?: string;
  component?: string;
  nodeId?: string;
};

type Totals = { total: number; errors: number; warns: number; infos: number };

type PluginToUi =
  | { type: 'STATUS'; status: ScanStatus }
  | { type: 'RESULTS'; results: Finding[]; totals: Totals }
  | { type: 'APPEND_LOG'; text: string };

type UiToPlugin =
  | { type: 'RUN_SCAN' }
  | { type: 'HIGHLIGHT'; nodeId: string }
  | { type: 'EXPORT_JSON' };

// ---- UI ----
figma.showUI(uiHtml, { width: 620, height: 760 });

function post(msg: PluginToUi) {
  figma.ui.postMessage(msg);
}
const log = (...a: any[]) => {
  const text = a.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
  post({ type: 'APPEND_LOG', text });
  // параллельно остаёмся в консоли Figma:
  // eslint-disable-next-line no-console
  console.log('[Design Lint]', ...a);
}

figma.ui.onmessage = async (msg: UiToPlugin) => {
  if (msg.type === 'RUN_SCAN') {
    await runScan();
  }
  if (msg.type === 'HIGHLIGHT') {
    try {
      const node = figma.getNodeById(msg.nodeId);
      if (node) {
        figma.currentPage.selection = [node as SceneNode];
        figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      } else {
        figma.notify('Node not found (already deleted?)');
      }
    } catch {
      figma.notify('Cannot highlight this node');
    }
  }
  if (msg.type === 'EXPORT_JSON') {
    // Последние рассчитанные результаты мы не храним централизованно,
    // поэтому при экспорте просто прогоняем быструю пересборку.
    const { results, totals } = await scanDocument();
    const payload = JSON.stringify({ results, totals }, null, 2);
    await figma.createNodeFromSvg(`<svg/>`); // no-op to keep plugin “busy” a tick
    // Выведем как уведомление + в лог. Пользователь может забрать из UI через Copy.
    log('JSON exported', payload.slice(0, 200) + (payload.length > 200 ? '…' : ''));
    figma.notify('JSON готов. Скопируйте его из панели логов (в UI).');
    post({ type: 'STATUS', status: 'completed' });
    post({ type: 'RESULTS', results, totals });
  }
};

// ---- Сканер ----

async function runScan() {
  post({ type: 'STATUS', status: 'scanning' });
  log('Запуск сканера…');

  try {
    const { results, totals } = await scanDocument();
    log('Скан завершён. Найдено:', { info: totals.infos, warn: totals.warns, error: totals.errors, all: totals.total });
    post({ type: 'RESULTS', results, totals });
    post({ type: 'STATUS', status: 'completed' });
  } catch (err) {
    log('Скан упал:', String(err));
    figma.notify('Scan failed. See logs.');
    post({ type: 'STATUS', status: 'error' });
  }
}

async function scanDocument(): Promise<{ results: Finding[]; totals: Totals }> {
  // Ensure all pages are loaded before scanning (required for documentAccess: dynamic-page)
  if (typeof (figma as any).loadAllPagesAsync === 'function') {
    await (figma as any).loadAllPagesAsync();
  }

  const findings: Finding[] = [];
  const push = (f: Omit<Finding, 'id'>) => {
    findings.push(Object.assign({ id: String(findings.length + 1) }, f));
  };

  // Утилиты
  const pathOf = (n: BaseNode): string => {
    const names: string[] = [];
    let p: BaseNode | null = n;
    while (p) {
      if ('name' in p) names.push(p.name);
      p = p.parent as any;
    }
    names.reverse();
    if (names[0] === 'Document') names.shift();
    return names.join(' / ');
  };

  // 1) Дубликаты компонентов: глобально по имени, оригинал — самый ранний
  const allComponents = figma.root.findAll(n => n.type === 'COMPONENT') as ComponentNode[];
  const byName = new Map<string, ComponentNode[]>();
  for (const comp of allComponents) {
    const key = comp.name || 'unnamed';
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(comp);
  }
  for (const [name, comps] of byName.entries()) {
    if (comps.length <= 1) continue;
    const sorted = comps.slice().sort((a, b) => {
      // earliest first; fall back to order of appearance if createdAt is missing
      const ca = (a as any).createdAt ?? 0;
      const cb = (b as any).createdAt ?? 0;
      if (ca && cb && ca !== cb) return ca - cb;
      return 0;
    });
    const [original, ...dups] = sorted;
    for (const dup of dups) {
      push({
        severity: 'warn',
        rule: 'duplicate',
        message: [
          'Компонент является дубликатом.',
          'Дубликаты расходятся с оригиналом и усложняют поддержку дизайн-системы со временем.',
          `Оригинал создан раньше и находится на странице "${original.parent?.name || 'Unknown'}".`,
        ].join('\n'),
        path: pathOf(dup),
        component: name,
        nodeId: dup.id,
      });
    }
  }

  // 2) Несоответствия стилей (миксы)
  figma.root.findAll(n => true).forEach(n => {
    try {
      const asAny = n as any;

      if ('fills' in asAny && asAny.fills === figma.mixed) {
        push({
          severity: 'warn',
          rule: 'mixed-style',
          message: [
            'Смешанные заливки (fills = mixed).',
            'Такой слой собран из разных стилей/цветов, его сложно синхронизировать и переиспользовать.',
          ].join('\n'),
          path: pathOf(n),
          nodeId: n.id,
        });
      }
      if ('strokes' in asAny && asAny.strokes === figma.mixed) {
        push({
          severity: 'warn',
          rule: 'mixed-style',
          message: [
            'Смешанные обводки (strokes = mixed).',
            'Несогласованные границы могут по-разному выглядеть и ломать единообразие компонентов.',
          ].join('\n'),
          path: pathOf(n),
          nodeId: n.id,
        });
      }
      if ('effects' in asAny && asAny.effects === figma.mixed) {
        push({
          severity: 'warn',
          rule: 'mixed-style',
          message: [
            'Смешанные эффекты (effects = mixed).',
            'Разные эффекты в одном слое ведут к непредсказуемому виду и мешают поддержке стилей.',
          ].join('\n'),
          path: pathOf(n),
          nodeId: n.id,
        });
      }
      if (n.type === 'TEXT') {
        if (n.fontName === figma.mixed) {
          push({
            severity: 'warn',
            rule: 'mixed-style',
            message: [
              'Смешанные шрифты (fontName = mixed).',
              'Текст собран из разных шрифтов, его сложно синхронизировать и поддерживать.',
            ].join('\n'),
            path: pathOf(n),
            nodeId: n.id,
          });
        }
        if (n.textStyleId === figma.mixed) {
          push({
            severity: 'warn',
            rule: 'mixed-style',
            message: [
              'Смешанный текстовый стиль (textStyleId = mixed).',
              'Несогласованные текстовые стили ломают единообразие типографики и усложняют редизайн.',
            ].join('\n'),
            path: pathOf(n),
            nodeId: n.id,
          });
        }
      }
      if (n.type === 'INSTANCE') {
        if (n.mainComponent) {
          if (Math.round(n.width) !== Math.round(n.mainComponent.width) ||
              Math.round(n.height) !== Math.round(n.mainComponent.height)) {
            push({
              severity: 'info',
              rule: 'instance-size',
              message: [
                `Экземпляр отличается по размеру от master-компонента "${n.mainComponent.name}".`,
                'Размеры инстансов должны совпадать с master, иначе они легко “ломают” макет.',
              ].join('\n'),
              path: pathOf(n),
              component: n.mainComponent.name,
              nodeId: n.id,
            });
          }
        } else {
          push({
            severity: 'info',
            rule: 'instance-detached',
            message: [
              'Экземпляр не привязан к библиотеке.',
              'Отвязанные инстансы перестают получать обновления и могут устаревать.',
            ].join('\n'),
            path: pathOf(n),
            nodeId: n.id,
          });
        }
      }
    } catch (err) {
      log('Node scan failed', pathOf(n), String(err));
    }
  });

  // 3) Подсчёт тоталов
  const totals: Totals = { total: findings.length, errors: 0, warns: 0, infos: 0 };
  for (const f of findings) {
    if (f.severity === 'error') totals.errors++;
    else if (f.severity === 'warn') totals.warns++;
    else totals.infos++;
  }

  return { results: findings, totals };
}
