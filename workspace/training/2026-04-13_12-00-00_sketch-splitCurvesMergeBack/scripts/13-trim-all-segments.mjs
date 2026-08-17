// Trim ALL segments then mergeBack — what happens when everything is removed?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimAll' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

  await snapshot('before')

  // Split
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[13] splitIds:', JSON.stringify(splitIds), 'count:', splitIds.length)

  // Trim ALL segments
  const trimR = await api.v1.sketch.trimCurves({ id: skId, curveIds: splitIds })
  console.log('[13] trimCurves maxLevel:', trimR.maxLevel)

  // mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[13] mergeBack result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  // What's left?
  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[13] geomAfter:', JSON.stringify(geomAfter.result))
  filewrite(geomAfter.result, 'geometry-after-trim-all')

  await snapshot('after')

  return { partId }
}
