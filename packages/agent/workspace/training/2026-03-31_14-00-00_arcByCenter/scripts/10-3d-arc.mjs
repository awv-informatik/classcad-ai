// 10 — 3D arc: arc in a non-XY plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Arc in XZ plane
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [20, 0, 0],
    endPos: [0, 0, 20],
    isClockwise: false,
  })
  console.log('[10] XZ arc:', r1.result, 'maxLevel:', r1.maxLevel)

  // Arc in arbitrary 3D plane
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [50, 10, 10],
    startPos: [65, 10, 10],
    endPos: [50, 25, 10],
    isClockwise: false,
  })
  console.log('[10] 3D arc:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    xzArc: { maxLevel: r1.maxLevel, messages: r1.messages },
    arc3d: { maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'response')

  await snapshot('3d-arcs')
  return { partId, shapeId }
}
