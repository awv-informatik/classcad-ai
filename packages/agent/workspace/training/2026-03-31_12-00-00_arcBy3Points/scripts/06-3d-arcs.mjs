// 06 - 3D arcs: non-zero Z coordinates
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: '3DArc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs3D' })).result

  // Arc in XZ plane (Y=0, Z varies)
  const r1 = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [25, 0, 25],
    endPos: [50, 0, 0],
  })
  console.log('[06] XZ arc maxLevel:', r1.maxLevel)

  // Arc in YZ plane (X=0)
  const r2 = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [0, 25, 25],
    endPos: [0, 50, 0],
  })
  console.log('[06] YZ arc maxLevel:', r2.maxLevel)

  // Fully 3D arc (all coords vary)
  const r3 = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 20],
    endPos: [40, 0, 0],
  })
  console.log('[06] 3D arc maxLevel:', r3.maxLevel)

  filewrite({
    xz: { maxLevel: r1.maxLevel, messages: r1.messages },
    yz: { maxLevel: r2.maxLevel, messages: r2.messages },
    full3d: { maxLevel: r3.maxLevel, messages: r3.messages },
  }, '3d-responses')

  await snapshot('3d-arcs')
  return { partId }
}
