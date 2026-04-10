// 13 — Better delete verification using structure tree
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteVerify' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [40, 0, 0], endPos: [40, 30, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [60, 10, 0], endPos: [100, 10, 0] })).result

  const rs = await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })
  console.log('[13] rigidSet:', rs.result, '(members:', l1, l2, ') standalone:', l3)

  // Structure before delete
  const skNode = rs.structure.tree[String(skId)]
  console.log('[13] sketch children before delete:', skNode.children)

  // Delete rigid set
  const del = await api.v1.sketch.deleteObject({ ids: [rs.result] })

  // Structure after delete
  const skNodeAfter = del.structure.tree[String(skId)]
  console.log('[13] sketch children after delete:', skNodeAfter ? skNodeAfter.children : 'SKETCH GONE')

  // Check each ID's existence
  for (const id of [l1, l2, l3, rs.result]) {
    const exists = !!del.structure.tree[String(id)]
    console.log(`[13] id ${id} exists after delete: ${exists}`)
  }

  filewrite({
    childrenBefore: skNode.children,
    childrenAfter: skNodeAfter?.children,
  }, 'delete-verify')

  await snapshot('after-delete')
  return { partId }
}
