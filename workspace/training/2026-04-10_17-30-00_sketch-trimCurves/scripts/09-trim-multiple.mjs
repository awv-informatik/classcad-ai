// 09: Trim multiple segments in one call, verify all removed after merge
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimMulti' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle + diagonal line through it
  const rect = (await api.v1.sketch.rectangle({ id: skId, startPos: [-40, -30, 0], endPos: [40, 30, 0] })).result
  const diag = (await api.v1.sketch.line({ id: skId, startPos: [-60, -50, 0], endPos: [60, 50, 0] })).result
  console.log('[09] rect:', rect, 'diag:', diag)

  await snapshot('before')

  // Split
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  const splitIds = splitRes.result
  console.log('[09] split IDs:', JSON.stringify(splitIds))
  console.log('[09] split count:', splitIds?.length)

  // Identify segments
  const tree = splitRes.structure?.tree
  for (const id of splitIds) {
    // Search structure tree recursively
    const findNode = (obj, targetId) => {
      if (!obj || typeof obj !== 'object') return null
      if (obj.id === targetId) return obj
      for (const v of Object.values(obj)) {
        const found = findNode(v, targetId)
        if (found) return found
      }
      return null
    }
    const node = findNode(splitRes.structure, id)
    if (node) {
      console.log('[09] id:', id, 'name:', node.name, 'class:', node.class)
    }
  }

  // Trim first 3 segments at once
  if (splitIds && splitIds.length >= 3) {
    const toTrim = splitIds.slice(0, 3)
    console.log('[09] trimming IDs:', JSON.stringify(toTrim))
    const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: toTrim })
    console.log('[09] trimCurves maxLevel:', trimRes.maxLevel)

    // Merge back
    const mergeRes = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
    console.log('[09] mergeBack maxLevel:', mergeRes.maxLevel)

    await snapshot('after-trim-merge')

    const geom = await api.v1.sketch.getGeometry({ id: skId })
    filewrite(geom.result, 'geom-after')
    console.log('[09] geometry after:', JSON.stringify(geom.result))
  }

  return { partId }
}
