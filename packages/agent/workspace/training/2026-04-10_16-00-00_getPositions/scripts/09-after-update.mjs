// Does getPositions reflect updates after updateGeometry?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result

  // Before update
  const before = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[09] before:', JSON.stringify(before))

  // Update the line's start position
  const pts = (await api.v1.sketch.getPoints({ id: lineId })).result
  const ur = await api.v1.sketch.updateGeometry({ id: pts.startId, pos: [0, 0, 0] })
  console.log('[09] updateGeometry maxLevel:', ur.maxLevel)

  // After update
  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[09] after:', JSON.stringify(after))

  const changed = JSON.stringify(before) !== JSON.stringify(after)
  console.log('[09] positions changed:', changed)

  filewrite({ before, after, changed }, 'update-comparison')

  return { partId }
}
