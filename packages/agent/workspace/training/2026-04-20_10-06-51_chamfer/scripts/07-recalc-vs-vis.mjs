export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcVsVis' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  // Without anything — get baseline edge IDs
  const geoBaseline = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[07] baseline edge IDs:', JSON.stringify(geoBaseline))

  // Try recalc
  await api.v1.common.recalc({})
  const geoAfterRecalc = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[07] after recalc edge IDs:', JSON.stringify(geoAfterRecalc))

  // Try requestVisualisation
  await api.v1.common.requestVisualisation({ id: partId })
  const geoAfterVis = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[07] after requestVisualisation edge IDs:', JSON.stringify(geoAfterVis))

  // Try TWO_DISTANCES with recalc-only IDs
  // First create a fresh part without vis
  const partId2 = (await api.v1.part.create({ name: 'RecalcOnly' })).result
  const boxId2 = (await api.v1.part.box({ id: partId2, name: 'Box2', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})
  const edgesRecalc = (await api.v1.part.getGeometryIds({
    id: partId2,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[07] recalc-only edges:', JSON.stringify(edgesRecalc))

  const r = await api.v1.part.chamfer({
    id: partId2,
    references: edgesRecalc,
    type: 'TWO_DISTANCES',
    distance1: 5,
    distance2: 15,
  })
  console.log('[07] TWO_DISTANCES on recalc-only edge:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[07] messages:', JSON.stringify(r.messages))

  filewrite({
    baseline: geoBaseline,
    afterRecalc: geoAfterRecalc,
    afterVis: geoAfterVis,
    recalcOnlyEdges: edgesRecalc,
    chamferResult: r.result,
    chamferMaxLevel: r.maxLevel,
  }, 'comparison')

  return { partId, partId2 }
}
