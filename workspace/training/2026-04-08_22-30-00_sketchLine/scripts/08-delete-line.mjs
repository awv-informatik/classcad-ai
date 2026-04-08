// 08 — deleteObject: delete a line and verify cleanup
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [50, 30, 0] })).result
  console.log('[08] line1:', line1, 'line2:', line2)

  await snapshot('before-delete')

  // Delete line1
  const r = await api.v1.sketch.deleteObject({ ids: [line1] })
  console.log('[08] delete result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-delete')

  // Try to get points of deleted line — should fail
  const pts = await api.v1.sketch.getPoints({ id: line1 })
  console.log('[08] getPoints of deleted line:', JSON.stringify(pts.result), 'maxLevel:', pts.maxLevel)

  // Verify line2 still exists
  const pts2 = await api.v1.sketch.getPoints({ id: line2 })
  console.log('[08] line2 still exists:', JSON.stringify(pts2.result))

  filewrite({ deleteResult: r.result, maxLevel: r.maxLevel, deletedLinePoints: pts.result, line2Points: pts2.result }, 'delete-results')

  return { partId, skId }
}
