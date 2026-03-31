// 04 — Create a shape with curves, verify structure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'WithCurves' })).result

  console.log('[04] shapeId:', shapeId)

  // Add some curves
  const l1 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[04] line result:', l1.result, 'maxLevel:', l1.maxLevel)

  const c1 = await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 15 })
  console.log('[04] circle result:', c1.result, 'maxLevel:', c1.maxLevel)

  // Check shape's children in structure
  const tree = c1.structure.tree
  const shapeNode = tree[String(shapeId)]
  console.log('[04] shape children:', shapeNode?.children?.length)

  const childInfo = (shapeNode?.children || []).map(cid => {
    const n = tree[String(cid)]
    return { id: cid, class: n?.class, name: n?.name }
  })
  console.log('[04] child details:', JSON.stringify(childInfo))
  filewrite(childInfo, 'shape-children')

  await snapshot('shape-with-curves')

  return { shapeId }
}
