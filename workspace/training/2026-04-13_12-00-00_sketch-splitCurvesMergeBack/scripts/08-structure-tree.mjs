// Dump structure tree at each stage to understand what mergeBack does to internal state
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructureTree' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

  // Dump structure before split
  const r1 = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(r1, 'stage1-before-split')

  // Split
  const splitR = await api.v1.sketch.splitAllCurves({ id: skId })
  filewrite(splitR, 'stage2-after-split')

  // Trim one segment
  await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitR.result[0]] })
  const r3 = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(r3, 'stage3-after-trim')

  // mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  filewrite(mergeR, 'stage4-after-mergeBack')

  const r5 = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(r5, 'stage5-final-geometry')

  console.log('[08] stage1 geom:', JSON.stringify(r1.result))
  console.log('[08] stage2 splitIds:', JSON.stringify(splitR.result))
  console.log('[08] stage3 geom after trim:', JSON.stringify(r3.result))
  console.log('[08] stage4 mergeBack:', mergeR.result, 'maxLevel:', mergeR.maxLevel)
  console.log('[08] stage5 final geom:', JSON.stringify(r5.result))

  return { partId }
}
