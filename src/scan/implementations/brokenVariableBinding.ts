import { getNodePath } from '../../utils/node-path';
import type { FindingDraft, RuleEvaluator } from './shared';
import {
  extractVariableBindings,
  getComponentPropertyDefinitionsFor,
  getPageName,
  getUnsafeNodes,
  isNodeUnsafe,
  markNodeUnsafe,
} from './shared';

async function scanNodeForVariableIssues(node: BaseNode) {
  // Trigger variable binding access; guards inside will mark unsafe on failure.
  await extractVariableBindings(node);

  // Component property definitions can throw on components or sets.
  if (node.type === 'COMPONENT') {
    await getComponentPropertyDefinitionsFor(node as ComponentNode);
  }
  if (node.type === 'COMPONENT_SET') {
    try {
      // Accessor can throw; we only care about deterministic API failure.
      const defs = (node as ComponentSetNode).componentPropertyDefinitions;
      // Touch the object to force resolution.
      Object.keys(defs);
    } catch (err) {
      markNodeUnsafe(node, `componentSet.componentPropertyDefinitions: ${String(err)}`);
    }
  }
}

export const brokenVariableBinding: RuleEvaluator = async ({ root }) => {
  const findings: FindingDraft[] = [];

  const nodes = root.findAll(() => true);
  for (const node of nodes) {
    // run sequentially to avoid overwhelming async variable calls; errors are captured internally
    // eslint-disable-next-line no-await-in-loop
    await scanNodeForVariableIssues(node as BaseNode);
  }

  for (const { node, reasons } of getUnsafeNodes()) {
    if (!isNodeUnsafe(node)) continue;
    const reason = reasons[0] || 'Unresolved variable binding';
    findings.push({
      message: `Broken variable bindings or component properties (${reason}).`,
      page: getPageName(node),
      nodeId: node.id,
      path: getNodePath(node),
    });
  }

  return findings;
};
