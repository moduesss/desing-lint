import { RULE_DEFINITIONS } from '../dist/lint/rules.js';
import { RULE_IMPLEMENTATIONS } from '../dist/scan/index.js';

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
