// Test deleting the circular pattern constraint — does geometry survive?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [40, 0, 0] })).result
  const centerPt = (await api.v1.sketch.point({ id: skId, pos: [0, 0, 0] })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result

  const r = await api.v1.sketch.circularPattern({
    id: skId, rigidSetId: rsId, centerId: centerPt,
    angle: Math.PI / 2, count: 4,
  })
  console.log('[11] pattern geometry:', r.result.geometry)
  console.log('[11] constraint:', r.result.constraint, 'dimension:', r.result.dimension)

  // Get positions before deletion
  const posBefore = await api.v1.sketch.getPositions({ id: skId })
  console.log('[11] positions before delete count:', posBefore.result?.length)

  // Delete the constraint
  const del = await api.v1.sketch.deleteObject({ ids: [r.result.constraint] })
  console.log('[11] delete maxLevel:', del.maxLevel)

  // Get positions after deletion — does the geometry survive?
  const posAfter = await api.v1.sketch.getPositions({ id: skId })
  console.log('[11] positions after delete count:', posAfter.result?.length)

  filewrite({
    pattern: r.result,
    deleteResult: { result: del.result, messages: del.messages, maxLevel: del.maxLevel },
    positionsBefore: posBefore.result?.length,
    positionsAfter: posAfter.result?.length,
  }, 'delete-pattern')

  return { partId }
}
