const { runLint } = require('../dist/lint/engine')
const { DEFAULT_LINT_CONFIG } = require('../dist/lint/config')

// Минимальный fake DocumentNode
const fakeDocument = {
  type: 'DOCUMENT',
  children: []
}

async function run() {
  try {
    const report = await runLint(fakeDocument, DEFAULT_LINT_CONFIG)

    if (!report || !Array.isArray(report.findings)) {
      throw new Error('Invalid report shape')
    }

    console.log('✅ Engine sanity check passed')
  } catch (err) {
    console.error('❌ Engine sanity check failed')
    console.error(err)
    process.exit(1)
  }
}

run()
