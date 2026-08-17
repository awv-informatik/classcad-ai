// splitAllCurves → mergeBack on non-intersecting curves
// Question: What happens when curves don't intersect? split returns originals — does mergeBack preserve them?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonIntersect' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Two lines that don't cross
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 20, 0], endPos: [50, 20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [-50, -20, 0], endPos: [50, -20, 0] })).result
  console.log('[14] l1:', l1, 'l2:', l2)

  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[14] geomBefore:', JSON.stringify(geomBefore.result))

  // Split (no intersections — returns originals)
  const splitIds = (await api.v1.sketch.splitAllCurves({ id: skId })).result
  console.log('[14] splitIds:', JSON.stringify(splitIds))

  // mergeBack
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[14] mergeBack result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[14] geomAfter:', JSON.stringify(geomAfter.result))
  console.log('[14] IDs preserved:', JSON.stringify(geomBefore.result) === JSON.stringify(geomAfter.result))

  return { partId }
}
