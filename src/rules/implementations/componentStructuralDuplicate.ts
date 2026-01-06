import { getNodePath } from '../../figma/traversal/node-path';
import type { FindingDraft, RuleEvaluator } from '../../figma';
import {
  areVariantsInSameSet,
  buildComponentSignature,
  getComponentKey,
  getPageName,
  isNodeUnsafe,
} from '../../figma';

export const componentTrueDuplicate: RuleEvaluator = ({ root, config }) => {
  const findings: FindingDraft[] = [];
  const groups = config.designSystem?.semanticComponents;
  if (!groups) return findings;

  const allComponents = root.findAll(n => n.type === 'COMPONENT') as ComponentNode[];
  const byId = new Map<string, ComponentNode>();
  const byKey = new Map<string, ComponentNode>();
  for (const comp of allComponents) {
    byId.set(comp.id, comp);
    const key = getComponentKey(comp);
    if (key) byKey.set(key, comp);
  }

  for (const groupId of Object.keys(groups)) {
    const group = groups[groupId];
    const semanticId = group.id || groupId;
    const members: ComponentNode[] = [];
    const seen = new Set<string>();
    for (const id of group.componentIds || []) {
      const comp = byId.get(id);
      if (comp && !seen.has(comp.id)) {
        members.push(comp);
        seen.add(comp.id);
      }
    }
    for (const key of group.componentKeys || []) {
      const comp = byKey.get(key);
      if (comp && !seen.has(comp.id)) {
        members.push(comp);
        seen.add(comp.id);
      }
    }

    const intentionalIds = new Set(group.intentionalComponentIds || []);
    const intentionalKeys = new Set(group.intentionalComponentKeys || []);
    const filtered = members.filter(m => {
      if (isNodeUnsafe(m)) return false;
      const key = getComponentKey(m);
      if (intentionalIds.has(m.id)) return false;
      if (key && intentionalKeys.has(key)) return false;
      return true;
    });

    if (filtered.length < 2) continue;

    for (const comp of filtered) {
      const hasDuplicate = filtered.some(other => other !== comp && !areVariantsInSameSet(comp, other));
      if (!hasDuplicate) continue;
      findings.push({
        message: `Component belongs to semantic group "${semanticId}" and has true duplicates.`,
        page: getPageName(comp),
        nodeId: comp.id,
        path: getNodePath(comp),
        component: semanticId,
      });
    }
  }

  return findings;
};

export const componentStructuralDuplicate: RuleEvaluator = async ({ root }) => {
  const findings: FindingDraft[] = [];
  const allComponents = root.findAll(n => n.type === 'COMPONENT') as ComponentNode[];
  const groups = new Map<string, ComponentNode[]>();

  for (const comp of allComponents) {
    if (isNodeUnsafe(comp)) continue;
    const signature = await buildComponentSignature(comp);
    if (isNodeUnsafe(comp)) continue;
    const parent = comp.parent;
    // Use stable parent identity (component set id) to avoid collisions from identical names.
    const parentKey = parent && parent.type === 'COMPONENT_SET' ? parent.id : 'no-component-set';
    const key = `${parentKey}::${signature}`;
    const list = groups.get(key) || [];
    list.push(comp);
    groups.set(key, list);
  }

  const getCreatedAt = (comp: ComponentNode): number => {
    const value = (comp as any).createdAt;
    return typeof value === 'number' ? value : Number.POSITIVE_INFINITY;
  };

  for (const comps of groups.values()) {
    if (comps.length < 2) continue;
    const sorted = comps.slice().sort((a, b) => {
      const ca = getCreatedAt(a);
      const cb = getCreatedAt(b);
      if (ca !== cb) return ca - cb;
      return a.id.localeCompare(b.id);
    });
    const [original, ...candidates] = sorted;
    const duplicates = candidates.filter(comp => !areVariantsInSameSet(original, comp));
    if (!duplicates.length) continue;

    const parent = original.parent;
    const logicalName = parent && parent.type === 'COMPONENT_SET' ? parent.name : original.name;
    findings.push({
      message: 'Component master is structurally identical to another master component.',
      page: getPageName(original),
      component: logicalName,
      items: duplicates.map(comp => ({
        label: comp.name,
        nodeId: comp.id,
        path: getNodePath(comp),
        page: getPageName(comp),
      })),
    });
  }

  return findings;
};
