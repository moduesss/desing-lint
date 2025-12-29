import { runLint } from '../dist/lint/engine.js';
import { DEFAULT_LINT_CONFIG } from '../dist/lint/config.js';

// Minimal fake DocumentNode
const fakeDocument = {
  type: 'DOCUMENT',
  children: [],
};

async function run() {
  try {
    const report = await runLint(fakeDocument, DEFAULT_LINT_CONFIG);

    if (!report || !Array.isArray(report.findings)) {
      throw new Error('Invalid report shape');
    }

    console.log('✅ Engine sanity check passed');
  } catch (err) {
    console.error('❌ Engine sanity check failed');
    console.error(err);
    process.exit(1);
  }
}

run();
