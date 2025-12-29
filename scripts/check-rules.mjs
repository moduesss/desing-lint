import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmpDir = mkdtempSync(join(tmpdir(), 'design-lint-check-'));
const rulesOut = join(tmpDir, 'rules.mjs');
const scanOut = join(tmpDir, 'scan.mjs');

await build({
  entryPoints: ['src/lint/rules.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'es2020',
  outfile: rulesOut,
  logLevel: 'silent',
});

await build({
  entryPoints: ['src/scan/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'es2020',
  outfile: scanOut,
  logLevel: 'silent',
});

const { RULE_DEFINITIONS } = await import(pathToFileURL(rulesOut).href);
const { RULE_IMPLEMENTATIONS } = await import(pathToFileURL(scanOut).href);

const defined = new Set(RULE_DEFINITIONS.map(r => r.id));
const implemented = new Set(Object.keys(RULE_IMPLEMENTATIONS));

const missingImpl = [...defined].filter(id => !implemented.has(id));
const missingDef = [...implemented].filter(id => !defined.has(id));

if (missingImpl.length || missingDef.length) {
  console.error('❌ Rule mismatch detected');

  if (missingImpl.length) {
    console.error('Rules without implementation:');
    missingImpl.forEach(id => console.error('  -', id));
  }

  if (missingDef.length) {
    console.error('Implementations without definition:');
    missingDef.forEach(id => console.error('  -', id));
  }

  process.exit(1);
}

console.log('✅ All rules are properly declared and implemented');
