// Correct test of getPositions after updateGeometry — use correct updateGeometry params
// updateGeometry takes: { id, pos?, startPos?, endPos?, centerPos?, radius? }
// For a line, update via startPos/endPos on the line ID itself
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [10, 20, 0], endPos: [70, 60, 0] })).result

  // Before
  const before = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[12] before:', JSON.stringify(before))

  // Update the line directly with new startPos
  const ur = await api.v1.sketch.updateGeometry({ id: lineId, startPos: [0, 0, 0] })
  console.log('[12] updateGeometry maxLevel:', ur.maxLevel, 'messages:', JSON.stringify(ur.messages))

  // After
  const after = (await api.v1.sketch.getPositions({ id: lineId })).result
  console.log('[12] after:', JSON.stringify(after))

  const changed = JSON.stringify(before) !== JSON.stringify(after)
  console.log('[12] positions changed:', changed)

  filewrite({ before, after, changed, updateMaxLevel: ur.maxLevel }, 'update-line-comparison')

  return { partId }
}
