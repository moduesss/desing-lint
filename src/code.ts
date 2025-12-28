import uiHtml from '../dist/ui.html';
import { runLint } from './lint/engine';
import { RULE_DEFINITIONS } from './lint/rules';
import { DEFAULT_LINT_CONFIG } from './lint/config';
import { getNodePath } from './utils/node-path';
import type { LintConfig, LintReport, PluginToUi, UiToPlugin } from './utils/types';

figma.showUI(uiHtml, { width: 620, height: 760 });

let currentConfig: LintConfig = DEFAULT_LINT_CONFIG;
let lastReport: LintReport | null = null;

function post(msg: PluginToUi) {
  figma.ui.postMessage(msg);
}

const log = (...args: unknown[]) => {
  const text = args.map(v => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
  post({ type: 'APPEND_LOG', text });
  // eslint-disable-next-line no-console
  console.log('[Design Lint]', ...args);
};

post({ type: 'RULES', rules: RULE_DEFINITIONS });

figma.ui.onmessage = async (msg: UiToPlugin) => {
  if (msg.type === 'RUN_SCAN') {
    await runScan();
  }
  if (msg.type === 'HIGHLIGHT') {
    await highlightNode(msg.nodeId);
  }
  if (msg.type === 'EXPORT_JSON') {
    await exportJson();
  }
};

async function runScan() {
  post({ type: 'STATUS', status: 'scanning' });
  log('Lint started...');
  try {
    const report = await lintDocument();
    lastReport = report;
    log('Lint completed.', report.totals);
    post({ type: 'RESULTS', report, rules: RULE_DEFINITIONS });
    post({ type: 'STATUS', status: 'completed' });
  } catch (err) {
    log('Lint failed:', String(err));
    figma.notify('Scan failed. See logs.');
    post({ type: 'STATUS', status: 'error' });
  }
}

async function lintDocument(): Promise<LintReport> {
  if (typeof (figma as any).loadAllPagesAsync === 'function') {
    await (figma as any).loadAllPagesAsync();
  }
  return runLint(figma.root, currentConfig);
}

async function highlightNode(nodeId: string) {
  try {
    if (typeof (figma as any).loadAllPagesAsync === 'function') {
      await (figma as any).loadAllPagesAsync();
    }
    const node = typeof (figma as any).getNodeByIdAsync === 'function'
      ? await (figma as any).getNodeByIdAsync(nodeId)
      : figma.getNodeById(nodeId);
    if (!node) {
      figma.notify('Node not found (already deleted?)');
      return;
    }

    let page: BaseNode | null = node;
    while (page && page.type !== 'PAGE') {
      page = page.parent;
    }
    if (!page || page.type !== 'PAGE') {
      figma.notify('Cannot highlight this node');
      return;
    }

    if (typeof (page as any).loadAsync === 'function') {
      await (page as any).loadAsync();
    }
    if (figma.currentPage !== page) {
      if (typeof (figma as any).setCurrentPageAsync === 'function') {
        await (figma as any).setCurrentPageAsync(page as PageNode);
      } else {
        figma.currentPage = page;
      }
    }

    try {
      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
    } catch (err) {
      log('Highlight failed', getNodePath(node), String(err));
      figma.notify('Cannot highlight this node');
    }
  } catch (err) {
    log('Highlight failed', String(err));
    figma.notify('Cannot highlight this node');
  }
}

async function exportJson() {
  const report = lastReport ?? await lintDocument();
  const payload = JSON.stringify({ report, rules: RULE_DEFINITIONS }, null, 2);
  await figma.createNodeFromSvg(`<svg/>`);
  log('JSON exported', payload.slice(0, 200) + (payload.length > 200 ? '…' : ''));
  figma.notify('JSON готов. Скопируйте его из панели логов (в UI).');
  post({ type: 'RESULTS', report, rules: RULE_DEFINITIONS });
  post({ type: 'STATUS', status: 'completed' });
}
