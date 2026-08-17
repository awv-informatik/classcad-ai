// 01 — basic line creation, inspect return value and structure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinePart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[01] partId:', partId, 'skId:', skId)

  // Create a simple line
  const r = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })
  console.log('[01] line result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  // Inspect structure to see what nodes were created
  const lineId = r.result
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'line-response')

  // Get the points of the line
  const pts = await api.v1.sketch.getPoints({ id: lineId })
  console.log('[01] getPoints:', JSON.stringify(pts.result))

  // Get positions of both endpoints
  const startPos = await api.v1.sketch.getPositions({ id: pts.result.startId })
  const endPos = await api.v1.sketch.getPositions({ id: pts.result.endId })
  console.log('[01] startPos:', JSON.stringify(startPos.result))
  console.log('[01] endPos:', JSON.stringify(endPos.result))

  // Dump structure for the line and its children
  filewrite(r.structure, 'structure')

  await snapshot('basic-line')

  return { partId, skId, lineId }
}
