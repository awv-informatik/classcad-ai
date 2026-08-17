/**
 * 04-update-param.mjs — after updateBox changes a parameter, topology unchanged
 * but expression/parameter values reflect the new value somewhere in the tree.
 */

export default async function (api, { tree, filewrite }) {
  const partR = await api.v1.part.create({ name: 'P' })
  const boxR = await api.v1.part.box({ id: partR.result, name: 'B', length: 100, width: 100, height: 100 })
  const boxId = boxR.result

  const before = await tree()
  const beforeNodes = Object.keys(before.tree).length
  filewrite(before, 'tree-before-update')

  const updR = await api.v1.part.updateBox({ id: boxId, length: 200 })
  console.log(`[04] update maxLevel=${updR.maxLevel}`)

  const after = await tree()
  const afterNodes = Object.keys(after.tree).length
  filewrite(after, 'tree-after-update')

  const sameTopology = afterNodes === beforeNodes
  console.log(`[04] same node count: ${sameTopology ? '✓' : '❌'} (${beforeNodes} → ${afterNodes})`)

  // Look for any node carrying an expression with the value 200.
  const all = Object.values(after.tree)
  const has200 = all.some(n =>
    n.members && Object.values(n.members).some(m => m.value === 200 || m.expression === '200'))
  console.log(`[04] new value 200 present in tree: ${has200 ? '✓' : '❌'}`)
}
