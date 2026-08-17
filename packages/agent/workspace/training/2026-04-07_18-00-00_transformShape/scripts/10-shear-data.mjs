// Test: verify what shear (non-orthogonal) matrix actually does — dump structure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ShearData' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S' })).result

  // Simple rectangle using individual lines for easy coord tracking
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 10, 0], endPos: [0, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 10, 0], endPos: [0, 0, 0] })

  // Apply shear: X += 0.5*Y
  // Expected: (0,0)->(0,0), (20,0)->(20,0), (20,10)->(25,10), (0,10)->(5,10)
  const r = await api.v1.curve.transformShape({
    id: shapeId,
    matrix: [
      [1, 0.5, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })
  console.log('[10] shear result:', r.result, 'maxLevel:', r.maxLevel)

  // Dump structure to check coordinates
  filewrite(r.structure, 'shear-structure')

  await snapshot('10-shear-data')

  return { partId, shapeId }
}
