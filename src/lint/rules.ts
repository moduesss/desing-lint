import type { RuleDefinition } from '../utils/types';

export const RULE_DEFINITIONS: RuleDefinition[] = [
  {
    id: 'component-true-duplicate',
    level: 'ds',
    defaultSeverity: 'warn',
    title: 'True Component Duplicate',
    description: 'Multiple component masters represent the same logical component.',
    rationale: 'True duplication leads to divergence and long-term maintenance issues.',
    whenTriggered:
      'Components are identified as the same semantic component and are not variants of the same Component Set and are not intentionally differentiated by props, states, or variants.',
    notes: 'Name-based comparison alone is insufficient and must not be used.',
  },
  {
    id: 'text-mixed-font-family',
    level: 'structural',
    defaultSeverity: 'error',
    title: 'Mixed Font Family in Text',
    description: 'A single text node uses multiple font families.',
    rationale: 'Mixing font families in one text block breaks typographic hierarchy.',
    whenTriggered: 'fontName === figma.mixed',
  },
  {
    id: 'text-mixed-color-or-decoration',
    level: 'stylistic',
    defaultSeverity: 'info',
    title: 'Mixed Text Color or Decoration',
    description: 'A single text node uses multiple colors or text decorations.',
    rationale: 'This is commonly used for links, highlights, and emphasis.',
    whenTriggered: 'textStyleId === figma.mixed AND font family and font size remain consistent.',
  },
  {
    id: 'instance-size-override',
    level: 'stylistic',
    defaultSeverity: 'off',
    title: 'Instance Size Override',
    description: 'An instance has dimensions different from its master.',
    rationale: 'In responsive and auto-layout designs this is expected behavior.',
    whenTriggered: 'Instance width or height differs from master.',
    notes: 'This rule should be disabled by default.',
  },
  {
    id: 'component-structural-duplicate',
    level: 'structural',
    defaultSeverity: 'warn',
    title: 'Structural Component Duplicate',
    description:
      'Two or more master components are structurally identical and represent duplicated sources of truth.',
    rationale:
      'Structurally identical master components inevitably diverge over time and increase maintenance cost.',
    whenTriggered:
      'Triggered when components are masters, not in the same Component Set, share equivalent internal structure, and have equivalent public API (component properties/variants and default values).',
    notes:
      'Comparison is structural only: no name matching, no design-system configuration, and no variants of the same Component Set.',
  },
  {
    id: 'instance-detached',
    level: 'structural',
    defaultSeverity: 'error',
    title: 'Detached Instance',
    description: 'An instance is detached from its master component.',
    rationale: 'Detached instances stop receiving updates and silently diverge.',
    whenTriggered: 'instance.mainComponent === null',
  },
];
