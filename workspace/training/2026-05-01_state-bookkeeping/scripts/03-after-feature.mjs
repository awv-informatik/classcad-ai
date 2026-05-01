/**
 * 03-after-feature.mjs — after part.box, the box is in the tree as a child of the part.
 */

export default async function (api, { tree, filewrite }) {
  const partR = await api.v1.part.create({ name: 'P' })
  const partId = partR.result

  const before = await tree()
  const beforeNodes = Object.keys(before.tree).length

  const boxR = await api.v1.part.box({ id: partId, name: 'Box1', length: 100, width: 80, height: 50 })
  const boxId = boxR.result

  const after = await tree()
  const afterNodes = Object.keys(after.tree).length
  filewrite(after, 'tree-after-box')

  const boxNode = await tree({ id: boxId })

  // Walk the parent chain — features live inside CC_EntitySet, not directly
  // under the part. We require the box's ancestor chain to include the part.
  const chain = []
  let cur = boxNode
  while (cur && cur.parent != null) {
    chain.push(cur.parent)
    cur = after.tree[String(cur.parent)]
  }

  const grew = afterNodes > beforeNodes
  const boxFound = boxNode && boxNode.class === 'CC_Box'
  const undertPart = chain.includes(partId)

  console.log(`[03] tree grew: ${grew ? '✓' : '❌'} (${beforeNodes} → ${afterNodes})`)
  console.log(`[03] boxId=${boxId} found as CC_Box: ${boxFound ? '✓' : '❌'} (class=${boxNode?.class})`)
  console.log(`[03] box ancestor chain reaches part: ${undertPart ? '✓' : '❌'} (chain: ${chain.join(' → ')})`)
}
