// 06 — Degenerate: all points coincident, or center == start
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // All three points same
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [5, 5, 0],
    startPos: [5, 5, 0],
    endPos: [5, 5, 0],
  })
  console.log('[06a] all coincident:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06a] messages:', JSON.stringify(r1.messages))

  // Center == start but end different
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [0, 0, 0],
    endPos: [10, 0, 0],
  })
  console.log('[06b] center==start:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[06b] messages:', JSON.stringify(r2.messages))

  // Center == end but start different
  const r3 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [0, 0, 0],
  })
  console.log('[06c] center==end:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[06c] messages:', JSON.stringify(r3.messages))

  filewrite({
    allCoincident: { maxLevel: r1.maxLevel, messages: r1.messages },
    centerEqStart: { maxLevel: r2.maxLevel, messages: r2.messages },
    centerEqEnd: { maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'degenerate-results')

  return { partId, shapeId }
}
