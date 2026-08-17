// Do sketch points survive the split+mergeBack cycle?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PointsSurvive' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a point and two intersecting lines
  const pt = (await api.v1.sketch.point({ id: skId, pos: [10, 10, 0] })).result
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-30, 0, 0], endPos: [30, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -30, 0], endPos: [0, 30, 0] })).result
  console.log('[18] pt:', pt, 'l1:', l1, 'l2:', l2)

  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[18] geomBefore:', JSON.stringify(geomBefore.result))

  // Split, trim one segment, mergeBack
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[18] splitIds:', JSON.stringify(splitIds))

  // Trim first line segment
  await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0]] })
  await api.v1.sketch.splitCurvesMergeBack({ id: skId })

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[18] geomAfter:', JSON.stringify(geomAfter.result))

  // Check if point survived
  const pointsSurvived = geomAfter.result?.points?.length > 0
  console.log('[18] points survived:', pointsSurvived)

  filewrite({ before: geomBefore.result, after: geomAfter.result, pointsSurvived }, 'points-comparison')

  return { partId }
}
