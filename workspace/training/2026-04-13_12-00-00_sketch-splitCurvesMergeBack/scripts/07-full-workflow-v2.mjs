// Full trim workflow v2 — with proper geometry queries and data verification
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimWorkflowV2' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[07] circleId:', circleId, 'lineId:', lineId)

  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[07] geomBefore:', JSON.stringify(geomBefore.result))
  await snapshot('before')

  // Step 1: Split
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[07] splitIds:', JSON.stringify(splitIds), 'count:', splitIds.length)

  // Step 2: Trim upper arc + middle line segment
  console.log('[07] Trimming ids:', splitIds[0], '(upper arc) and', splitIds[3], '(middle line)')
  const trimR = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0], splitIds[3]] })
  console.log('[07] trimCurves maxLevel:', trimR.maxLevel)

  await snapshot('after-trim-before-merge')

  // Step 3: mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[07] mergeBack result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  // Check geometry after
  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[07] geomAfter:', JSON.stringify(geomAfter.result))
  filewrite(geomAfter.result, 'getGeom-after-mergeBack')

  await snapshot('after-mergeBack')

  // Count: before had 2 curves (circle + line), after should have 3 (lower arc + 2 line segments)
  const beforeCount = geomBefore.result?.length
  const afterCount = geomAfter.result?.length
  console.log('[07] geometry count before:', beforeCount, 'after:', afterCount)

  return { partId }
}
