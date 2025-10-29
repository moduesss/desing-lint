/// <reference types="@figma/plugin-typings" />
import { findComponentNameDuplicates } from './duplicates'
import { checkStyleInconsistencies } from './styles'
import { checkLibraryLinks } from './library'
import type { ScanReport, Finding } from '../utils/types'
import type { DesignTokens } from '../utils/tokens'

export async function runAllAnalyzers(tokens?: DesignTokens): Promise<ScanReport> {
  const startedAt = Date.now()
  const doc = figma.root

  const buckets: Finding[] = []
  buckets.push(...findComponentNameDuplicates(doc))
  buckets.push(...checkStyleInconsistencies(doc, tokens))
  buckets.push(...checkLibraryLinks(doc))

  const totals = buckets.reduce(
    (acc, f) => {
      acc.all += 1
      acc[f.severity] += 1 as any
      return acc
    },
    { info: 0, warn: 0, error: 0, all: 0 }
  )

  const finishedAt = Date.now()
  return { startedAt, finishedAt, totals, findings: buckets }
}
