// 03: Dump structure tree before/after split and trim to understand sub-curve hierarchy
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimStruct' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw two intersecting lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result
  console.log('[03] line1:', line1, 'line2:', line2)

  // Get structure before split
  const r1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 0, 0] })
  // Actually let's use a dummy call to get structure
  const structBefore = (await api.v1.common.getAppVersion({})).structure
  filewrite(structBefore, 'structure-before-split')

  // Split all curves
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[03] splitAllCurves result:', JSON.stringify(splitRes.result))
  filewrite(splitRes.structure, 'structure-after-split')

  // Get positions of the split curve IDs
  for (const id of splitRes.result) {
    try {
      const posRes = await api.v1.sketch.getPositions({ id: skId, curveId: id })
      console.log('[03] positions for id', id, ':', JSON.stringify(posRes.result))
    } catch (e) {
      console.log('[03] getPositions failed for id', id, ':', e.message)
    }
  }

  // Trim the first curve
  const trimId = splitRes.result[0]
  console.log('[03] trimming curve:', trimId)
  const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [trimId] })
  console.log('[03] trimCurves maxLevel:', trimRes.maxLevel)
  filewrite(trimRes.structure, 'structure-after-trim')

  // Check positions of remaining split IDs
  for (const id of splitRes.result) {
    try {
      const posRes = await api.v1.sketch.getPositions({ id: skId, curveId: id })
      console.log('[03] after-trim positions for id', id, ':', JSON.stringify(posRes.result))
    } catch (e) {
      console.log('[03] after-trim getPositions failed for id', id, ':', e.message)
    }
  }

  await snapshot('after-trim')
  return { partId }
}
