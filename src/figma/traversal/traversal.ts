export function* walk(node: BaseNode): Generator<BaseNode> {
  yield node
  if ('children' in node) {
    for (const child of node.children) yield* walk(child)
  }
}
