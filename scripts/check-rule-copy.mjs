import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const tmpDir = mkdtempSync(join(tmpdir(), 'design-lint-rulecopy-'));
const metaOut = join(tmpDir, 'meta.mjs');
const copyOut = join(tmpDir, 'copy.mjs');

const buildConfig = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'es2020',
  logLevel: 'silent',
};

await build({
  entryPoints: ['src/rules/meta.ts'],
  outfile: metaOut,
  ...buildConfig,
});

await build({
  entryPoints: ['src/rules/copy/index.ts'],
  outfile: copyOut,
  ...buildConfig,
});

const { RULE_META } = await import(pathToFileURL(metaOut).href);
const { ruleCopyByLang } = await import(pathToFileURL(copyOut).href);

const requiredFields = ['title', 'description', 'rationale', 'whenTriggered', 'message'];
const expectedLangs = ['en', 'ru'];

const errors = [];
const ruleIds = RULE_META.map(r => r.id);
const copyLangs = Object.keys(ruleCopyByLang);

for (const lang of expectedLangs) {
  if (!copyLangs.includes(lang)) {
    errors.push(`Missing rule copy for language: ${lang}`);
  }
}

const extraLangs = copyLangs.filter(l => !expectedLangs.includes(l));
if (extraLangs.length) {
  errors.push(`Unexpected languages in rule copy: ${extraLangs.join(', ')}`);
}

for (const lang of expectedLangs) {
  const dict = ruleCopyByLang[lang];
  if (!dict) continue;

  const copyIds = new Set(Object.keys(dict));
  const missing = ruleIds.filter(id => !copyIds.has(id));
  const extra = [...copyIds].filter(id => !ruleIds.includes(id));

  if (missing.length) {
    errors.push(`[${lang}] Missing rule copy for ids: ${missing.join(', ')}`);
  }
  if (extra.length) {
    errors.push(`[${lang}] Extra rule copy entries not in RULE_META: ${extra.join(', ')}`);
  }

  for (const id of ruleIds) {
    const entry = dict[id];
    for (const field of requiredFields) {
      const value = entry?.[field];
      if (typeof value !== 'string' || !value.trim()) {
        errors.push(`[${lang}] Rule "${id}" is missing field "${field}" or it is empty`);
      }
    }
  }
}

if (errors.length) {
  console.error('❌ Rule copy check failed:');
  errors.forEach(err => console.error('  -', err));
  process.exit(1);
}

console.log('✅ Rule copy is complete for all rules and languages');
