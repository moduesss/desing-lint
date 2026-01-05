import type { RuleCopy } from '../../utils/types';
import type { RuleId } from '../../lint/rules/meta';

export const ruleCopyEn: Record<RuleId, RuleCopy> = {
  'broken-variable-binding': {
    title: 'Broken Variable Binding',
    description: 'Variable bindings or component properties cannot be read due to Figma API inconsistencies.',
    rationale:
      'A node with unreadable variable bindings or component properties is technically invalid and may silently diverge.',
    whenTriggered:
      'Accessing variable bindings, aliases, resolved variables, componentPropertyDefinitions, or component set property definitions throws or returns missing data.',
    message: '{{component}}',
  },
  'component-true-duplicate': {
    title: 'True Component Duplicate',
    description: 'Multiple component masters represent the same logical component.',
    rationale: 'True duplication leads to divergence and long-term maintenance issues.',
    whenTriggered:
      'Components are identified as the same semantic component and are not variants of the same Component Set and are not intentionally differentiated by props, states, or variants.',
    message: 'Component belongs to semantic group "{{component}}" and has true duplicates.',
  },
  'text-mixed-font-family': {
    title: 'Multiple font families in a text layer',
    description: 'This text layer contains characters that use different font families.',
    rationale:
      'Mixed font families within a single text layer often indicate accidental overrides or incomplete refactoring. This can make typography harder to maintain and reduce consistency when the component is reused.',
    whenTriggered: 'Triggered when a single text layer includes characters with different font family values.',
    message: 'Text layer contains characters with different font families.',
  },
  'text-mixed-color-or-decoration': {
    title: 'Multiple colors or decorations in a text layer',
    description:
      'This text layer contains characters with different text colors or decorations, while font family and size remain consistent.',
    rationale:
      'Multiple colors or decorations within a single text layer are often used intentionally for emphasis or links. At the same time, they can also appear as accidental overrides or leftover styling. This check helps you review whether the variation is intentional.',
    whenTriggered:
      'Triggered when a single text layer contains multiple colors or text decorations, while using the same font family and font size.',
    message: 'Text layer mixes colors or text decorations while keeping font family and size consistent.',
  },
  'instance-size-override': {
    title: 'Instance Size Override',
    description: 'An instance has dimensions different from its master.',
    rationale: 'In responsive and auto-layout designs this is expected behavior.',
    whenTriggered: 'Instance width or height differs from master.',
    message: 'Instance size differs from its master "{{component}}".',
  },
  'component-structural-duplicate': {
    title: 'Structural Component Duplicate',
    description:
      'Two or more master components are structurally identical and represent duplicated sources of truth.',
    rationale:
      'Structurally identical master components inevitably diverge over time and increase maintenance cost.',
    whenTriggered:
      'Triggered when components are masters, not in the same Component Set, share equivalent internal structure, and have equivalent public API (component properties/variants and default values).',
    message: 'Component master is structurally identical to another master component.',
  },
  'instance-detached': {
    title: 'Detached Instance',
    description: 'An instance is detached from its master component.',
    rationale: 'Detached instances stop receiving updates and silently diverge.',
    whenTriggered: 'instance.mainComponent === null',
    message: 'Instance is detached from its master component.',
  },
  'engine-rule-failure': {
    title: 'Rule execution failed',
    description: 'A lint rule crashed during scanning. Scan continued with partial results.',
    rationale:
      'This usually happens due to a Figma API inconsistency or an unexpected node state. Other checks still completed.',
    whenTriggered: 'Triggered when a rule evaluator throws an error during scanning.',
    message: 'A rule failed during scanning.',
  },
} as const;
