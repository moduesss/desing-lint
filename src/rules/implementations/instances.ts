import { getNodePath } from '../../figma/traversal/node-path';
import type { FindingDraft, RuleEvaluator } from '../../figma';
import { getPageName, isNodeUnsafe, resolveMainComponent } from '../../figma';

export const instanceSizeOverride: RuleEvaluator = async ({ root }) => {
  const findings: FindingDraft[] = [];
  const instances = root.findAll(n => n.type === 'INSTANCE') as InstanceNode[];
  for (const node of instances) {
    if (isNodeUnsafe(node)) continue;
    const main = await resolveMainComponent(node);
    if (!main) continue;
    if (node.width !== main.width || node.height !== main.height) {
      findings.push({
        message: `Instance size differs from its master "${main.name}".`,
        page: getPageName(node),
        nodeId: node.id,
        path: getNodePath(node),
        component: main.name,
      });
    }
  }
  return findings;
};

export const instanceDetached: RuleEvaluator = async ({ root }) => {
  const findings: FindingDraft[] = [];
  const instances = root.findAll(n => n.type === 'INSTANCE') as InstanceNode[];
  for (const node of instances) {
    if (isNodeUnsafe(node)) continue;
    const main = await resolveMainComponent(node);
    if (main === null) {
      findings.push({
        message: 'Instance is detached from its master component.',
        page: getPageName(node),
        nodeId: node.id,
        path: getNodePath(node),
      });
    }
  }
  return findings;
};
