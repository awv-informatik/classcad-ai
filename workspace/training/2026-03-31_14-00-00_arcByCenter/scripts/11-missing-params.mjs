// 11 — Missing required parameters
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Missing centerPos
  const r1 = await api.v1.curve.arcByCenter({
    id: shapeId,
    startPos: [10, 0, 0],
    endPos: [0, 10, 0],
  })
  console.log('[11a] no centerPos:', r1.maxLevel, JSON.stringify(r1.messages))

  // Missing startPos
  const r2 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    endPos: [0, 10, 0],
  })
  console.log('[11b] no startPos:', r2.maxLevel, JSON.stringify(r2.messages))

  // Missing endPos
  const r3 = await api.v1.curve.arcByCenter({
    id: shapeId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
  })
  console.log('[11c] no endPos:', r3.maxLevel, JSON.stringify(r3.messages))

  // Missing id
  const r4 = await api.v1.curve.arcByCenter({
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [0, 10, 0],
  })
  console.log('[11d] no id:', r4.maxLevel, JSON.stringify(r4.messages))

  filewrite({
    noCenterPos: { maxLevel: r1.maxLevel, messages: r1.messages },
    noStartPos: { maxLevel: r2.maxLevel, messages: r2.messages },
    noEndPos: { maxLevel: r3.maxLevel, messages: r3.messages },
    noId: { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'missing-params')

  return { partId }
}
