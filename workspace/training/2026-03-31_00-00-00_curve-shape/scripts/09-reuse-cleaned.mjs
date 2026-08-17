// 09 — Can you add new curves to a cleaned shape?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Reuse' })).result

  // Add initial curve
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  await snapshot('before-clean')

  // Clean it
  await api.v1.curve.cleanShape({ ids: [shapeId] })
  await snapshot('after-clean')

  // Add new curves to the cleaned shape
  const r = await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 20 })
  console.log('[09] circle after clean — result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-reuse')

  // Verify the shape has new geometry
  const tree = r.structure.tree
  const shapeNode = tree[String(shapeId)]
  console.log('[09] shape geometryIdList after reuse:', shapeNode?.geometryIdList)

  filewrite({
    reuse: { result: r.result, maxLevel: r.maxLevel },
    shapeAfter: { geometryIdList: shapeNode?.geometryIdList, name: shapeNode?.name }
  }, 'reuse-result')

  return { shapeId }
}
