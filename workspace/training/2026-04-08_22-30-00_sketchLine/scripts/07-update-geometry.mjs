// 07 — updateGeometry: move line endpoints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result
  console.log('[07] lineId:', lineId)

  // Get original positions
  const pts = await api.v1.sketch.getPoints({ id: lineId })
  const origStart = await api.v1.sketch.getPositions({ id: pts.result.startId })
  const origEnd = await api.v1.sketch.getPositions({ id: pts.result.endId })
  console.log('[07] before - start:', JSON.stringify(origStart.result), 'end:', JSON.stringify(origEnd.result))

  await snapshot('before-update')

  // Update both endpoints
  const r1 = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: lineId, startPos: [10, 10, 0], endPos: [80, 60, 0] }],
  })
  console.log('[07] update both:', r1.result, 'maxLevel:', r1.maxLevel)

  const newStart = await api.v1.sketch.getPositions({ id: pts.result.startId })
  const newEnd = await api.v1.sketch.getPositions({ id: pts.result.endId })
  console.log('[07] after - start:', JSON.stringify(newStart.result), 'end:', JSON.stringify(newEnd.result))

  await snapshot('after-update')

  // Try updating only startPos (omit endPos) — does it work or error?
  const r2 = await api.v1.sketch.updateGeometry({
    id: skId,
    lines: [{ id: lineId, startPos: [20, 0, 0] }],
  })
  console.log('[07] partial update (startPos only):', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] messages:', JSON.stringify(r2.messages))

  const afterPartial = await api.v1.sketch.getPositions({ id: pts.result.startId })
  const afterPartialEnd = await api.v1.sketch.getPositions({ id: pts.result.endId })
  console.log('[07] after partial - start:', JSON.stringify(afterPartial.result), 'end:', JSON.stringify(afterPartialEnd.result))

  filewrite({
    before: { start: origStart.result, end: origEnd.result },
    afterFull: { start: newStart.result, end: newEnd.result },
    afterPartial: { start: afterPartial.result, end: afterPartialEnd.result },
  }, 'update-comparison')

  return { partId, skId, lineId }
}
