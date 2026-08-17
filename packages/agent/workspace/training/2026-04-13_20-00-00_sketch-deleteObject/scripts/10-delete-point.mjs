// Test: deleting a standalone sketch point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelPoint' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const pt = (await api.v1.sketch.point({ id: skId, pos: [20, 20, 0] })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[10] point:', pt, 'line:', line)

  // Delete the point
  const r = await api.v1.sketch.deleteObject({ ids: [pt] })
  console.log('[10] delete point result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-point-response')

  // Verify line is still there, point is gone
  const geom = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[10] geom after:', JSON.stringify(geom.result))
  filewrite(geom.result, 'geom-after-point-delete')

  return { partId }
}
