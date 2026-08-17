// 02 - Multiple arcs in same shape + different shapes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiArc' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'S2' })).result

  // Two arcs in same shape
  const r1 = await api.v1.curve.arcBy3Points({
    id: s1, startPos: [0, 0, 0], midPos: [15, 20, 0], endPos: [30, 0, 0],
  })
  console.log('[02] arc1 maxLevel:', r1.maxLevel)

  const r2 = await api.v1.curve.arcBy3Points({
    id: s1, startPos: [0, -5, 0], midPos: [15, -25, 0], endPos: [30, -5, 0],
  })
  console.log('[02] arc2 maxLevel:', r2.maxLevel)

  // Arc in different shape
  const r3 = await api.v1.curve.arcBy3Points({
    id: s2, startPos: [50, 0, 0], midPos: [65, 15, 0], endPos: [80, 0, 0],
  })
  console.log('[02] arc3 maxLevel:', r3.maxLevel)

  await snapshot('multiple-arcs')
  return { partId }
}
