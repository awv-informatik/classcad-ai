/**
 * 05-delete-feature.mjs — after deleteFeature, the box is gone from tree().
 */

export default async function (api, { tree, filewrite }) {
  const partR = await api.v1.part.create({ name: 'P' })
  const boxR = await api.v1.part.box({ id: partR.result, name: 'B', length: 100, width: 100, height: 100 })
  const boxId = boxR.result

  const before = await tree()
  const beforeNodes = Object.keys(before.tree).length
  const beforeHasBox = !!before.tree[String(boxId)]

  await api.v1.part.deleteFeature({ ids: [boxId] })

  const after = await tree()
  const afterNodes = Object.keys(after.tree).length
  const afterHasBox = !!after.tree[String(boxId)]
  filewrite(after, 'tree-after-delete')

  const part = await tree({ id: partR.result })
  const stillChild = part && part.children && part.children.includes(boxId)

  console.log(`[05] before: box present=${beforeHasBox}, nodes=${beforeNodes}`)
  console.log(`[05] after: box present=${afterHasBox} (expect false)`)
  console.log(`[05] node count shrank: ${afterNodes < beforeNodes ? '✓' : '❌'} (${beforeNodes} → ${afterNodes})`)
  console.log(`[05] box no longer child of part: ${!stillChild ? '✓' : '❌'}`)
}
