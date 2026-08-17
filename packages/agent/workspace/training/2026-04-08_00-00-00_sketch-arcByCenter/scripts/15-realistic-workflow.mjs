// 15 — Realistic workflow: create arc-based D-shape, extrude to solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DShape' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // D-shape: arc on right, line on left
  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [0, -30, 0],
    centerPos: [0, 0, 0],
    endPos: [0, 30, 0],
    isClockwise: false,  // arc goes right (CCW from bottom to top)
  })).result

  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [0, 30, 0],
    endPos: [0, -30, 0],
  })).result

  console.log('[15] arc:', arcId, 'line:', lineId)

  // Create region
  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: [arcId, lineId],
  })).result
  console.log('[15] region:', regionId, '(null means auto-detect needed)')

  // If region failed, try without geomIds
  if (!regionId) {
    const sr2 = await api.v1.sketch.sketchRegion({ id: skId })
    console.log('[15] region retry (no geomIds):', sr2.result, 'maxLevel:', sr2.maxLevel)
  }

  await snapshot('d-shape-sketch')

  // Attempt extrusion if we have a region
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[15] geometry:', JSON.stringify(geo))
  filewrite(geo, 'geometry')

  return { partId }
}
