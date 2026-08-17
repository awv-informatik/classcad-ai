// mergeBack without prior splitAllCurves
// Question: What happens if we call mergeBack on a sketch that hasn't been split?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoPriorSplit' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw some geometry but do NOT call splitAllCurves
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-40, 0, 0], endPos: [40, 0, 0] })).result
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 20 })).result
  console.log('[03] lineId:', lineId, 'circleId:', circleId)

  await snapshot('before')

  // Call mergeBack directly
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[03] mergeBack result:', mergeR.result)
  console.log('[03] mergeBack maxLevel:', mergeR.maxLevel)
  console.log('[03] mergeBack messages:', JSON.stringify(mergeR.messages))
  filewrite({ result: mergeR.result, maxLevel: mergeR.maxLevel, messages: mergeR.messages }, 'mergeBack-no-split')

  await snapshot('after')

  // Check geometry is unchanged
  const geomAfter = await api.v1.sketch.geometry({ id: skId })
  filewrite(geomAfter.result, 'geometry-after')
  console.log('[03] geometry count after mergeBack:', geomAfter.result?.length)

  return { partId }
}
