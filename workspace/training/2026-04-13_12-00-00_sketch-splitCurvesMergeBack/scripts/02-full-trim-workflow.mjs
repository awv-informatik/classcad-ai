// Full trim workflow: splitAllCurves → trimCurves → splitCurvesMergeBack
// Question: Does the complete workflow produce correct trimmed geometry?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FullTrimWorkflow' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw a circle intersected by a horizontal line
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[02] circleId:', circleId, 'lineId:', lineId)

  // Get geometry before
  const geomBefore = await api.v1.sketch.geometry({ id: skId })
  filewrite(geomBefore.result, 'geometry-before')
  await snapshot('before')

  // Step 1: Split
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[02] splitIds:', JSON.stringify(splitIds))
  console.log('[02] splitIds count:', splitIds.length)

  // Step 2: Trim the upper arc (first segment) and the middle line segment
  // Circle → 2 arcs: [0]=upper, [1]=lower
  // Line → 3 parts: [2]=left, [3]=middle, [4]=right
  console.log('[02] Trimming upper arc (index 0) and middle line (index 3)')
  const trimR = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0], splitIds[3]] })
  console.log('[02] trimCurves maxLevel:', trimR.maxLevel)

  await snapshot('after-trim-before-merge')

  // Step 3: mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[02] mergeBack result:', mergeR.result)
  console.log('[02] mergeBack maxLevel:', mergeR.maxLevel)

  await snapshot('after-mergeBack')

  // Check geometry after
  const geomAfter = await api.v1.sketch.geometry({ id: skId })
  filewrite(geomAfter.result, 'geometry-after')
  console.log('[02] geometry before count:', geomBefore.result?.length, 'after count:', geomAfter.result?.length)

  return { partId }
}
