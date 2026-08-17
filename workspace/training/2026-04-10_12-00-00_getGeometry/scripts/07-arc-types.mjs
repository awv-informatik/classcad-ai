// Test whether getGeometry distinguishes arc types (arcByCenter vs arcBy3Points)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an arc by center
  const arcCenterId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [0, 0, 0], endPos: [40, 0, 0], centerPos: [20, 0, 0],
  })).result
  console.log('[07] arcByCenter ID:', arcCenterId)

  // Create an arc by 3 points
  const arc3PtId = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 30, 0], endPos: [40, 30, 0], midPos: [20, 45, 0],
  })).result
  console.log('[07] arcBy3Points ID:', arc3PtId)

  const r = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[07] getGeometry result:', JSON.stringify(r.result))
  console.log('[07] result keys:', Object.keys(r.result))

  filewrite({
    arcCenterId,
    arc3PtId,
    result: r.result,
    resultKeys: Object.keys(r.result),
    arcsArray: r.result.arcs,
    bothInArcs: r.result.arcs?.includes(arcCenterId) && r.result.arcs?.includes(arc3PtId),
  }, 'arc-types')

  await snapshot('arcs')
  return { partId, skId }
}
