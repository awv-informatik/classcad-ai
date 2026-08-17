// Trim a non-intersecting curve (returned as original ID from splitAllCurves), then mergeBack
// Question: Does mergeBack delete non-intersecting curves that were "trimmed"?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimNonIntersect' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two parallel non-intersecting lines
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 20, 0], endPos: [50, 20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-50, -20, 0], endPos: [50, -20, 0] })).result
  console.log('[15] l1:', l1, 'l2:', l2)

  await snapshot('before')

  // Split (returns originals since no intersections)
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[15] splitIds:', JSON.stringify(splitIds))

  // Trim one of the original IDs
  const trimR = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0]] })
  console.log('[15] trimCurves maxLevel:', trimR.maxLevel)

  // mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[15] mergeBack result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[15] geomAfter:', JSON.stringify(geomAfter.result))
  filewrite(geomAfter.result, 'geometry-after')

  await snapshot('after')

  return { partId }
}
