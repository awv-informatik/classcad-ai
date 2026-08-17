// Test whether getGeometry returns auto-created constraint points (incidence, fixation points)
// or only explicitly created geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create connected lines WITH auto-constraints on (default)
  const geo = await api.v1.sketch.geometry({
    id: skId,
    lines: [
      { startPos: [0, 0, 0], endPos: [50, 0, 0] },
      { startPos: [50, 0, 0], endPos: [50, 30, 0] },
    ],
    // all gen flags default TRUE — auto-constraints will be created
  })

  console.log('[12] created lines:', JSON.stringify(geo.result.lines))
  console.log('[12] created points:', JSON.stringify(geo.result.points))

  const r = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[12] getGeometry:', JSON.stringify(r.result))

  // With auto-constraints, the constraint solver may create additional points.
  // Are they returned by getGeometry?
  filewrite({
    createdIds: geo.result,
    queriedIds: r.result,
    createdPointCount: geo.result.points?.length,
    queriedPointCount: r.result.points?.length,
    createdLineCount: geo.result.lines?.length,
    queriedLineCount: r.result.lines?.length,
  }, 'constraint-points')

  return { partId, skId }
}
