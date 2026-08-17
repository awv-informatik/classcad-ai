// Single curve in sketch, no intersections — splitAllCurves → mergeBack
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SingleCurve' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[20] lineId:', lineId)

  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[20] geomBefore:', JSON.stringify(geomBefore.result))

  // Split (nothing to split)
  const splitR = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[20] splitIds:', JSON.stringify(splitR.result), 'maxLevel:', splitR.maxLevel)

  // mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[20] mergeBack result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[20] geomAfter:', JSON.stringify(geomAfter.result))
  console.log('[20] IDs preserved:', JSON.stringify(geomBefore.result) === JSON.stringify(geomAfter.result))

  return { partId }
}
