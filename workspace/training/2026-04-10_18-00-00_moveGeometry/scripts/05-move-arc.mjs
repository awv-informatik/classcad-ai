// 05 — Move an arc (arcByCenter and arcBy3Points)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arc1Id = (await api.v1.sketch.arcByCenter({
    id: skId, startPos: [40, 10, 0], endPos: [10, 40, 0], centerPos: [10, 10, 0],
  })).result
  console.log('[05] arc1Id (arcByCenter):', arc1Id)

  const arc2Id = (await api.v1.sketch.arcBy3Points({
    id: skId, startPos: [60, 10, 0], endPos: [90, 40, 0], midPos: [80, 15, 0],
  })).result
  console.log('[05] arc2Id (arcBy3Points):', arc2Id)

  // Get positions before
  const arc1Before = (await api.v1.sketch.getPositions({ id: arc1Id })).result
  const arc2Before = (await api.v1.sketch.getPositions({ id: arc2Id })).result
  console.log('[05] arc1 before:', JSON.stringify(arc1Before))
  console.log('[05] arc2 before:', JSON.stringify(arc2Before))

  await snapshot('before')

  // Move both arcs
  const r = await api.v1.sketch.moveGeometry({
    id: skId, geomIds: [arc1Id, arc2Id], translation: [5, 15, 0],
  })
  console.log('[05] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)

  const arc1After = (await api.v1.sketch.getPositions({ id: arc1Id })).result
  const arc2After = (await api.v1.sketch.getPositions({ id: arc2Id })).result
  console.log('[05] arc1 after:', JSON.stringify(arc1After))
  console.log('[05] arc2 after:', JSON.stringify(arc2After))

  filewrite({ arc1Before, arc1After, arc2Before, arc2After, moveResult: r.result, maxLevel: r.maxLevel }, 'move-arcs-result')

  await snapshot('after')

  return { partId }
}
