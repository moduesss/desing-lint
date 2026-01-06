import { isIgnorableVariableError, markNodeUnsafe, registerResetHook, safeAccess } from './safeAccess';

const variableResolutionCache = new Map<string, Promise<boolean>>();

registerResetHook(() => {
  variableResolutionCache.clear();
});

async function resolveVariable(aliasId: string | null | undefined, owner?: BaseNode): Promise<boolean> {
  if (!aliasId) return false;
  const cached = variableResolutionCache.get(aliasId);
  if (cached) return cached;

  const resolver = (figma as any).variables?.getVariableByIdAsync;
  if (typeof resolver !== 'function') {
    const fallback = Promise.resolve(true); // cannot validate; assume present
    variableResolutionCache.set(aliasId, fallback);
    return fallback;
  }

  const promise = (async () => {
    try {
      const resolved = await resolver.call((figma as any).variables, aliasId);
      if (!resolved && owner) {
        markNodeUnsafe(owner, `Variable alias ${aliasId} is missing`);
      }
      return !!resolved;
    } catch (err) {
      const message = String(err);
      if (isIgnorableVariableError(message)) return true;
      if (owner) {
        markNodeUnsafe(owner, `Variable alias ${aliasId} failed: ${message}`);
      }
      return false;
    }
  })();

  variableResolutionCache.set(aliasId, promise);
  return promise;
}

function normalizeVariableAlias(alias: VariableAlias | undefined): string | null {
  if (!alias || typeof alias.id !== 'string') return null;
  return alias.id;
}

export async function normalizeBoundVariables(
  map: { [key: string]: VariableAlias } | undefined,
  owner?: BaseNode,
): Promise<Record<string, string> | null> {
  if (!map) return null;
  const result: Record<string, string> = {};
  for (const key of Object.keys(map)) {
    const aliasId = normalizeVariableAlias(map[key]);
    if (!aliasId) continue;
    const exists = await resolveVariable(aliasId, owner);
    if (!exists) continue;
    result[key] = aliasId;
  }
  return Object.keys(result).length ? result : null;
}

export function extractStyleBindings(node: BaseNode): Record<string, string> | null {
  const anyNode = node as unknown as Record<string, unknown>;
  const result: Record<string, string> = {};
  const readStyleId = (value: unknown): string | null => {
    if (value === figma.mixed) return 'mixed';
    if (typeof value === 'string') return value;
    return null;
  };

  const styleFields = [
    'fillStyleId',
    'strokeStyleId',
    'textStyleId',
    'effectStyleId',
    'gridStyleId',
    'backgroundStyleId',
  ];
  for (const field of styleFields) {
    if (field in anyNode) {
      const styleId = readStyleId((anyNode as any)[field]);
      if (styleId !== null) result[field] = styleId;
    }
  }
  return Object.keys(result).length ? result : null;
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
    const parts: string[] = [];
    for (const key of keys) {
      parts.push(`${JSON.stringify(key)}:${stableStringify(obj[key])}`);
    }
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value);
}

async function extractPaintBindings(node: BaseNode, paints?: ReadonlyArray<Paint> | typeof figma.mixed): Promise<string[] | null> {
  if (!Array.isArray(paints)) return null;
  const items: string[] = [];
  for (const paint of paints) {
    const bindings = await normalizeBoundVariables((paint as any).boundVariables, node);
    if (bindings) {
      const payload = await safeAccess(node, 'paint boundVariables', () => Promise.resolve(stableStringify({ type: paint.type, bindings })));
      if (payload) items.push(payload);
    }
  }
  if (!items.length) return null;
  items.sort();
  return items;
}

async function extractEffectBindings(node: BaseNode, effects?: ReadonlyArray<Effect> | typeof figma.mixed): Promise<string[] | null> {
  if (!Array.isArray(effects)) return null;
  const items: string[] = [];
  for (const effect of effects) {
    const bindings = await normalizeBoundVariables((effect as any).boundVariables, node);
    if (bindings) {
      const payload = await safeAccess(node, 'effect boundVariables', () => Promise.resolve(stableStringify({ type: effect.type, bindings })));
      if (payload) items.push(payload);
    }
  }
  if (!items.length) return null;
  items.sort();
  return items;
}

export async function extractVariableBindings(node: BaseNode): Promise<Record<string, unknown> | null> {
  const anyNode = node as any;
  const result: Record<string, unknown> = {};
  const nodeBindings = await safeAccess(node, 'node boundVariables', () => normalizeBoundVariables(anyNode.boundVariables, node));
  if (nodeBindings) result.node = nodeBindings;

  const fillBindings = await safeAccess(node, 'fills boundVariables', () => extractPaintBindings(node, anyNode.fills));
  if (fillBindings) result.fills = fillBindings;

  const strokeBindings = await safeAccess(node, 'strokes boundVariables', () => extractPaintBindings(node, anyNode.strokes));
  if (strokeBindings) result.strokes = strokeBindings;

  const effectBindings = await safeAccess(node, 'effects boundVariables', () => extractEffectBindings(node, anyNode.effects));
  if (effectBindings) result.effects = effectBindings;

  return Object.keys(result).length ? result : null;
}
