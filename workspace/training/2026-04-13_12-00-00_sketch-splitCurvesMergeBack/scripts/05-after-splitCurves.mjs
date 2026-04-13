// mergeBack after splitCurves (manual split, not splitAllCurves)
// Prior finding says this is a no-op. Verify.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AfterSplitCurves' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[05] lineId:', lineId)

  // Manual split at midpoint
  const splitR = await api.v1.sketch.splitCurves({
    id: skId,
    splits: [{ geomId: lineId, values: [0.5] }]
  })
  console.log('[05] splitCurves result:', JSON.stringify(splitR.result))

  const geomAfterSplit = await api.v1.sketch.geometry({ id: skId })
  console.log('[05] geometry after splitCurves:', geomAfterSplit.result?.length, 'items')
  await snapshot('after-splitCurves')

  // Now try mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[05] mergeBack result:', mergeR.result)
  console.log('[05] mergeBack maxLevel:', mergeR.maxLevel)
  console.log('[05] mergeBack messages:', JSON.stringify(mergeR.messages))
  filewrite({ result: mergeR.result, maxLevel: mergeR.maxLevel, messages: mergeR.messages }, 'mergeBack-after-manual-split')

  // Check geometry unchanged
  const geomAfterMerge = await api.v1.sketch.geometry({ id: skId })
  console.log('[05] geometry after mergeBack:', geomAfterMerge.result?.length, 'items')
  filewrite(geomAfterMerge.result, 'geometry-after-mergeBack')

  await snapshot('after-mergeBack')

  return { partId }
}
