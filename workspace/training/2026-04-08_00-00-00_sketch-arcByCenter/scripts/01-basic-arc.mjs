// 01 — Basic arcByCenter: create a simple arc with default params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [-40, 0, 0],
    centerPos: [0, 0, 0],
    endPos: [40, 0, 0],
  })

  console.log('[01] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'arc-response')

  // Query structure to understand node layout
  const arcId = r.result
  const pts = await api.v1.sketch.getPoints({ id: arcId })
  console.log('[01] getPoints:', JSON.stringify(pts.result))

  const pos = await api.v1.sketch.getPositions({ id: arcId })
  console.log('[01] getPositions on arcId:', JSON.stringify(pos.result), 'maxLevel:', pos.maxLevel)

  // Get geometry listing
  const geo = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[01] getGeometry:', JSON.stringify(geo.result))

  filewrite(pts.result, 'getPoints-result')
  filewrite(pos.result, 'getPositions-result')
  filewrite(geo.result, 'getGeometry-result')

  await snapshot('basic-arc')
  return { partId, skId, arcId }
}
