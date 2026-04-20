// Verify sketch coord system change with getGeometry data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchData' })).result
  // Create sketch on a specific plane so we have a planeId
  const topPlane = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[17] partId:', partId, 'skId:', skId, 'lineId:', lineId, 'topPlane:', topPlane)

  // Get point positions before
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  console.log('[17] points:', JSON.stringify(pts))

  // Save STEP before
  const stepBefore = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result

  // Set coord system on the sketch — shift origin
  const r = await api.v1.common.setObjectCoordSystem({
    id: skId,
    origin: [0, 100, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[17] setObjectCoordSystem on sketch result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[17] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'sketch-response')

  // Save STEP after
  const stepAfter = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  console.log('[17] STEP files differ:', stepBefore.content !== stepAfter.content)
  filewrite(stepBefore.content, 'step-before')
  filewrite(stepAfter.content, 'step-after')

  await snapshot('after')

  return { partId, skId, lineId }
}
