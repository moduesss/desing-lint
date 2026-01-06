import type { Finding, LintConfig } from '../utils/types';

export type FindingDraft = Omit<Finding, 'id' | 'ruleId' | 'level' | 'severity'>;

export type RuleContext = {
  root: DocumentNode;
  config: LintConfig;
};

export type RuleEvaluator = (ctx: RuleContext) => Promise<FindingDraft[]> | FindingDraft[];

type UnsafeInfo = {
  node: BaseNode;
  reasons: string[];
};

type ResetHook = () => void;

const unsafeNodes = new Map<string, UnsafeInfo>();
const resetHooks: ResetHook[] = [];

export function registerResetHook(hook: ResetHook): void {
  resetHooks.push(hook);
}

export function resetUnsafeNodes(): void {
  unsafeNodes.clear();
  for (const hook of resetHooks) {
    hook();
  }
}

export function markNodeUnsafe(node: BaseNode, reason: string): void {
  const info = unsafeNodes.get(node.id);
  if (info) {
    if (!info.reasons.includes(reason)) info.reasons.push(reason);
    return;
  }
  const reasons = [reason];
  unsafeNodes.set(node.id, { node, reasons });
  // Minimal debug log with nodeId and reason; avoids UI spam.
  // eslint-disable-next-line no-console
  console.warn('[Design Lint] broken-variable-binding', node.id, reason);
}

export function isNodeUnsafe(node: BaseNode): boolean {
  return unsafeNodes.has(node.id);
}

export function getUnsafeNodes(): UnsafeInfo[] {
  return Array.from(unsafeNodes.values());
}

export async function safeAccess<T>(node: BaseNode, reason: string, action: () => Promise<T> | T): Promise<T | null> {
  try {
    return await action();
  } catch (err) {
    const message = `${reason}: ${String(err)}`;
    markNodeUnsafe(node, message);
    return null;
  }
}

export function isIgnorableVariableError(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes('documentaccess') || msg.includes('getvariablebyid');
}
