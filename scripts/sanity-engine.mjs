import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Stub minimal figma API required by runLint.
globalThis.figma = {
  loadAllPagesAsync: async () => {},
};

const tmpDir = mkdtempSync(join(tmpdir(), 'design-lint-engine-'));
const outFile = join(tmpDir, 'engine.mjs');

await build({
  entryPoints: ['src/lint/engine.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'es2020',
  outfile: outFile,
  logLevel: 'silent',
});

const { runLint, DEFAULT_LINT_CONFIG } = await import(pathToFileURL(outFile).href);

// Minimal fake DocumentNode
const emptyFindAll = () => [];
const fakePage = { type: 'PAGE', children: [], findAll: emptyFindAll };
const fakeDocument = {
  type: 'DOCUMENT',
  children: [fakePage],
  findAll: emptyFindAll,
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
