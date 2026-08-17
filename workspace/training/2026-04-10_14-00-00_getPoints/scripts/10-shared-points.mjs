// Do connected lines share point IDs at their junction?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two connected lines sharing endpoint [50, 30, 0]
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 30, 0], endPos: [100, 0, 0] })).result

  const pts1 = (await api.v1.sketch.getPoints({ id: line1 })).result
  const pts2 = (await api.v1.sketch.getPoints({ id: line2 })).result

  console.log('[10] line1 points:', JSON.stringify(pts1))
  console.log('[10] line2 points:', JSON.stringify(pts2))
  console.log('[10] shared? line1.endId === line2.startId:', pts1.endId === pts2.startId)

  filewrite({
    line1: { id: line1, points: pts1 },
    line2: { id: line2, points: pts2 },
    sharedEndpoint: pts1.endId === pts2.startId,
    line1EndId: pts1.endId,
    line2StartId: pts2.startId
  }, 'shared-points')

  await snapshot('connected-lines')
  return { partId }
}
