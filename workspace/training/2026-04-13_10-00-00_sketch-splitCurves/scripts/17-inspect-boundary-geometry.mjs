// Test: Inspect geometry of boundary/out-of-range splits using getGeometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoundaryGeo' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line from (-50,0,0) to (50,0,0) — 100 units long
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result

  // Split at 1.0 (endpoint) and -0.5 (before start)
  const r = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [-0.5, 0.5, 1.5] }]
  })
  console.log('[17] result:', JSON.stringify(r.result))

  // Get geometry for each segment
  if (r.result) {
    const segments = r.result[0]
    for (const segId of segments) {
      const geo = await api.v1.sketch.getGeometry({ id: segId })
      console.log(`[17] segment ${segId} geometry:`, JSON.stringify(geo.result))
    }
  }

  await snapshot('boundary-geometry')
  return { partId }
}
