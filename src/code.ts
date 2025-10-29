import { runAllAnalyzers } from './analyzers/index'
import type { ScanReport } from './utils/types'
import type { DesignTokens } from './utils/tokens'

figma.showUI(__html__, { width: 420, height: 580 })

function log(...args: any[]) { figma.notify('Design Lint: см. консоль для логов'); console.log('[DesignLint]', ...args) }

figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'RUN_SCAN': {
        log('Запуск сканера...')
        figma.ui.postMessage({ type: 'STATUS', payload: { status: 'scanning' } })
        const report: ScanReport = await runAllAnalyzers()
        log('Скан завершён. Найдено:', report.totals)
        figma.ui.postMessage({ type: 'SCAN_DONE', payload: report })
        break
      }
      case 'EXPORT_JSON': {
        const blob = JSON.stringify(msg.payload.report, null, 2)
        await figma.clientStorage.setAsync('lastReport', blob)
        figma.ui.postMessage({ type: 'EXPORTED', payload: { ok: true } })
        break
      }
      case 'HIGHLIGHT': {
        const node = figma.getNodeById(msg.payload.nodeId) as SceneNode | null
        if (node) {
          figma.currentPage.selection = [node]
          figma.viewport.scrollAndZoomIntoView([node])
        }
        break
      }
      default:
        log('Unknown message', msg)
    }
  } catch (e) {
    log('Ошибка:', e)
    figma.ui.postMessage({ type: 'ERROR', payload: { message: String(e) } })
  }
}

// relaunch button support
if (figma.command === 'scan') {
  figma.ui.postMessage({ type: 'STATUS', payload: { status: 'scanning' } })
  runAllAnalyzers().then((report) => {
    figma.ui.postMessage({ type: 'SCAN_DONE', payload: report })
  })
}
