// splitAllCurves → splitCurvesMergeBack (no trimming) — v2 with proper geometry queries
// Question: After split+mergeBack without trimming, what geometry exists? New IDs or originals?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergeBackV2' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[06] circleId:', circleId, 'lineId:', lineId)

  // Get geometry BEFORE split
  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] geomBefore:', JSON.stringify(geomBefore.result))

  await snapshot('before-split')

  // Split
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[06] splitIds:', JSON.stringify(splitIds))

  // Get geometry AFTER split (before mergeBack)
  const geomAfterSplit = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] geomAfterSplit:', JSON.stringify(geomAfterSplit.result))

  // Dump structure after split
  filewrite(geomAfterSplit.result, 'getGeom-after-split')

  await snapshot('after-split')

  // mergeBack (no trim)
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[06] mergeBack result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  // Get geometry AFTER mergeBack
  const geomAfterMerge = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[06] geomAfterMerge:', JSON.stringify(geomAfterMerge.result))
  filewrite(geomAfterMerge.result, 'getGeom-after-mergeBack')

  await snapshot('after-mergeBack')

  // Compare: are the IDs the same as before split?
  console.log('[06] IDs changed?', JSON.stringify(geomBefore.result) !== JSON.stringify(geomAfterMerge.result))

  return { partId }
}
