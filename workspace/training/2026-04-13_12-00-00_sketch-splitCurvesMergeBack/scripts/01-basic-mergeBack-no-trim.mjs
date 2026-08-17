// splitAllCurves → splitCurvesMergeBack (no trimming)
// Question: What happens when we split and immediately merge back without trimming?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergeBackBasic' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw intersecting geometry
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[01] circleId:', circleId, 'lineId:', lineId)

  await snapshot('before-split')

  // Step 1: Split
  const splitR = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[01] splitAllCurves result:', JSON.stringify(splitR.result))
  console.log('[01] splitAllCurves maxLevel:', splitR.maxLevel)

  await snapshot('after-split')

  // Step 2: mergeBack immediately (no trim)
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[01] mergeBack result:', mergeR.result)
  console.log('[01] mergeBack maxLevel:', mergeR.maxLevel)
  console.log('[01] mergeBack messages:', JSON.stringify(mergeR.messages))

  await snapshot('after-mergeBack')

  // Get geometry to see what exists now
  const geom = await api.v1.sketch.geometry({ id: skId })
  filewrite({ result: mergeR.result, maxLevel: mergeR.maxLevel, messages: mergeR.messages }, 'mergeBack-response')
  filewrite(geom.result, 'geometry-after-mergeBack')

  console.log('[01] geometry count after mergeBack:', geom.result?.length)

  return { partId }
}
