// 11: splitAllCurves on a single non-intersecting curve — what happens?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimSingle' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Just one line, no intersections
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  console.log('[11] line:', line)

  // Split all — should there be anything to split?
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[11] splitAllCurves result:', JSON.stringify(splitRes.result))
  console.log('[11] splitAllCurves maxLevel:', splitRes.maxLevel)
  console.log('[11] splitAllCurves messages:', JSON.stringify(splitRes.messages))

  // Test with two non-intersecting curves (parallel lines)
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 20, 0], endPos: [50, 20, 0] })).result
  console.log('[11] line2:', line2)

  const splitRes2 = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[11] splitAllCurves (parallel) result:', JSON.stringify(splitRes2.result))
  console.log('[11] splitAllCurves (parallel) maxLevel:', splitRes2.maxLevel)

  // If split returned IDs, try trimming
  if (Array.isArray(splitRes2.result) && splitRes2.result.length > 0) {
    const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitRes2.result[0]] })
    console.log('[11] trimCurves result maxLevel:', trimRes.maxLevel)

    const mergeRes = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
    console.log('[11] mergeBack maxLevel:', mergeRes.maxLevel)

    const geom = await api.v1.sketch.getGeometry({ id: skId })
    console.log('[11] geom after merge:', JSON.stringify(geom.result))
    await snapshot('after-trim-merge')
  } else {
    console.log('[11] no split IDs returned — trimCurves cannot be used')
    await snapshot('no-split')
  }

  return { partId }
}
