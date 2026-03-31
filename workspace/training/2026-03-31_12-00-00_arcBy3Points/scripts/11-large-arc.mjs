// 11 - Large arc (nearly full circle) and tiny arc
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcSizes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

  // Nearly full circle: start and end close together, mid on opposite side
  const r1 = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [1, 0, 0],
    midPos: [0, -25, 0],     // far away from start/end line, forces large arc
    endPos: [-1, 0, 0],
  })
  console.log('[11] large arc maxLevel:', r1.maxLevel)

  // Very tiny arc
  const r2 = await api.v1.curve.arcBy3Points({
    id: shapeId,
    startPos: [50, 0, 0],
    midPos: [50.001, 0.001, 0],
    endPos: [50.002, 0, 0],
  })
  console.log('[11] tiny arc maxLevel:', r2.maxLevel)

  filewrite({
    largeArc: { maxLevel: r1.maxLevel, messages: r1.messages },
    tinyArc: { maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'size-responses')

  await snapshot('arc-sizes')
  return { partId }
}
