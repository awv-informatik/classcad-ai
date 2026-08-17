// Q: What does the structure tree reveal about IDs? What objects does part.create produce?
export default async function (api) {
  const r1 = await api.v1.part.create({ name: 'TestPart' })
  const partId = r1.result

  // Examine the structure tree — it should show the full object hierarchy
  const tree = r1.structure
  if (!tree) {
    console.log('[05] No structure tree returned')
    return
  }

  // Walk the tree to find all objects with IDs
  function walk(node, depth = 0) {
    if (!node) return
    const indent = '  '.repeat(depth)
    const info = [
      `id=${node.id}`,
      node.name ? `name="${node.name}"` : null,
      node.class ? `class=${node.class}` : null,
    ].filter(Boolean).join(' ')
    console.log(`[05] ${indent}${info}`)
    if (node.children) {
      for (const child of node.children) walk(child, depth + 1)
    }
  }

  walk(tree)

  // Count total objects
  function countNodes(node) {
    if (!node) return 0
    let count = 1
    if (node.children) for (const c of node.children) count += countNodes(c)
    return count
  }
  console.log('[05] total objects after part.create:', countNodes(tree))
  console.log('[05] partId returned:', partId)

  // Now add a box and see the structure delta
  const boxId = (await api.v1.part.box({ id: partId })).result
  // Need to get fresh structure — execute another call
  const r3 = await api.v1.common.getAppVersion({})
  const tree2 = r3.structure
  console.log('[05] total objects after box:', tree2 ? countNodes(tree2) : 'no structure')
  console.log('[05] boxId returned:', boxId)
}
