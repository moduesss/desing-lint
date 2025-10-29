/// <reference types="@figma/plugin-typings" />

import { runAllAnalyzers } from './analyzers'
import type { ScanReport } from './utils/types'
import type { DesignTokens } from './utils/tokens'
import uiHtml from '../dist/index.html'

function log(...args: any[]) {
  console.log('[Design Lint]', ...args)
}

let tokensCache: DesignTokens | null = null

async function ensureTokens(): Promise<DesignTokens | null> {
  if (tokensCache) return tokensCache
  const raw = await figma.clientStorage.getAsync('tokens')
  if (raw) {
    try {
      tokensCache = JSON.parse(raw) as DesignTokens
    } catch (e) {
      console.warn('Ошибка парсинга токенов:', e)
    }
  }
  return tokensCache
}

function post(type: string, payload?: any) {
  figma.ui.postMessage({ type, payload })
}

figma.showUI(uiHtml, { width: 420, height: 580 })
post('STATUS', { status: 'idle' })

figma.ui.onmessage = async (msg: any) => {
  try {
    switch (msg.type) {

      case 'RUN_SCAN': {
        log('Запуск сканера...')
        post('STATUS', { status: 'scanning' })

        const tokens = await ensureTokens()
        const report: ScanReport = await runAllAnalyzers(tokens || undefined)

        log('Скан завершён. Найдено:', report.totals)
        post('SCAN_DONE', report)
        break
      }

      case 'EXPORT_JSON': {
        const report: ScanReport = msg.payload && msg.payload.report
        if (!report) { post('ERROR', { message: 'Нет данных для экспорта' }); return }
        await figma.clientStorage.setAsync('lastReport', JSON.stringify(report))
        post('EXPORTED', { ok: true })
        break
      }

      case 'LOAD_TOKENS': {
        const json = msg.payload && (msg.payload.json as string)
        try {
          const parsed: DesignTokens = JSON.parse(json)
          await figma.clientStorage.setAsync('tokens', JSON.stringify(parsed))
          tokensCache = parsed
          post('TOKENS_OK', { ok: true })
        } catch (e) {
          post('TOKENS_ERR', { message: String(e) })
        }
        break
      }

      case 'CLEAR_TOKENS': {
        await figma.clientStorage.deleteAsync('tokens')
        tokensCache = null
        post('TOKENS_OK', { ok: true })
        break
      }

      default:
        log('Неизвестное сообщение:', msg)
        break
    }
  } catch (err) {
    console.error('Ошибка в обработчике сообщений:', err)
    post('ERROR', { message: String(err) })
  }
}

figma.on('close', () => {
  log('Design Lint завершил работу')
})
