// Call mergeBack twice in a row after splitAllCurves
// Question: Is the second mergeBack a no-op or error?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DoubleMerge' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

  // Split
  await api.v1.sketch.splitAllCurves({ id: skId })

  // First mergeBack
  const merge1 = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[09] first mergeBack result:', merge1.result, 'maxLevel:', merge1.maxLevel)

  // Second mergeBack
  const merge2 = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[09] second mergeBack result:', merge2.result, 'maxLevel:', merge2.maxLevel)
  console.log('[09] second mergeBack messages:', JSON.stringify(merge2.messages))

  filewrite({ merge1: { result: merge1.result, maxLevel: merge1.maxLevel }, merge2: { result: merge2.result, maxLevel: merge2.maxLevel, messages: merge2.messages } }, 'double-mergeBack')

  // Check geometry still intact
  const geom = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[09] final geom:', JSON.stringify(geom.result))

  return { partId }
}
