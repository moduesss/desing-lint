import { getNodePath } from '../../figma/traversal/node-path';
import type { FindingDraft, RuleEvaluator } from '../../figma';
import { collectTextFamiliesAndSizes, getPageName, isNodeUnsafe } from '../../figma';

export const textMixedFontFamily: RuleEvaluator = ({ root }) => {
  const findings: FindingDraft[] = [];
  const textNodes = root.findAll(n => n.type === 'TEXT') as TextNode[];
  for (const node of textNodes) {
    if (isNodeUnsafe(node)) continue;
    const { families } = collectTextFamiliesAndSizes(node);
    if (families.size > 1) {
      findings.push({
        message: 'Text node uses multiple font families.',
        page: getPageName(node),
        nodeId: node.id,
        path: getNodePath(node),
      });
    }
  }
  return findings;
};

export const textMixedColorOrDecoration: RuleEvaluator = ({ root }) => {
  const findings: FindingDraft[] = [];
  const textNodes = root.findAll(n => n.type === 'TEXT') as TextNode[];
  for (const node of textNodes) {
    if (isNodeUnsafe(node)) continue;
    const hasMixedStyle = node.textStyleId === figma.mixed;
    if (!hasMixedStyle) continue;
    const { families, sizes } = collectTextFamiliesAndSizes(node);
    const fontFamilyConsistent = families.size === 1;
    const fontSizeConsistent = sizes.size === 1;
    if (fontFamilyConsistent && fontSizeConsistent) {
      findings.push({
        message: 'Text node mixes color or decoration while keeping font family and size consistent.',
        page: getPageName(node),
        nodeId: node.id,
        path: getNodePath(node),
      });
    }
  }
  return findings;
};
