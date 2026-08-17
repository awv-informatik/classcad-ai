// 09 — Wrong ID type: pass part ID instead of shape ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result

  // Wrong: pass partId instead of shapeId
  const r1 = await api.v1.curve.arcByCenter({
    id: partId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [0, 10, 0],
  })
  console.log('[09a] partId as id:', r1.maxLevel, JSON.stringify(r1.messages))

  // Wrong: pass eifId
  const r2 = await api.v1.curve.arcByCenter({
    id: eifId,
    centerPos: [0, 0, 0],
    startPos: [10, 0, 0],
    endPos: [0, 10, 0],
  })
  console.log('[09b] eifId as id:', r2.maxLevel, JSON.stringify(r2.messages))

  filewrite({
    partIdError: { maxLevel: r1.maxLevel, messages: r1.messages },
    eifIdError: { maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'wrong-id-results')

  return { partId }
}
