// Inspect structure of arc — what nodes are created, child points, constraints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })).result

  console.log('[02] arcId:', arcId)

  // getPoints — should return startId, endId, centerId like arcByCenter
  const pts = await api.v1.sketch.getPoints({ id: arcId })
  console.log('[02] getPoints result:', JSON.stringify(pts.result))
  console.log('[02] getPoints maxLevel:', pts.maxLevel)

  // getPositions — does it work directly on arc ID?
  const pos = await api.v1.sketch.getPositions({ id: arcId })
  console.log('[02] getPositions result:', JSON.stringify(pos.result))
  console.log('[02] getPositions maxLevel:', pos.maxLevel)

  // getGeometry — where does the arc appear?
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[02] getGeometry keys:', Object.keys(geo.result))
  console.log('[02] getGeometry arcs:', JSON.stringify(geo.result.arcs))
  console.log('[02] getGeometry lines:', JSON.stringify(geo.result.lines))
  console.log('[02] getGeometry points:', JSON.stringify(geo.result.points))

  filewrite({
    arcId,
    getPoints: pts.result,
    getPositions: pos.result,
    getGeometry: geo.result,
  }, 'structure')

  return { partId }
}
