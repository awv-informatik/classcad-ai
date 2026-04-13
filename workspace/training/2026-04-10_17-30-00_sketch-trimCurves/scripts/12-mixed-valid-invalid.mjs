// 12: Does a mixed valid+invalid trimCurves call apply the valid trim?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimMixed' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle + line
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result

  // Split
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  const splitIds = splitRes.result
  console.log('[12] split IDs:', JSON.stringify(splitIds))

  // Trim with one valid ID and one invalid ID
  const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0], 99999] })
  console.log('[12] mixed trim maxLevel:', trimRes.maxLevel)
  console.log('[12] mixed trim messages:', JSON.stringify(trimRes.messages))

  // Merge back and check if the valid trim was applied
  const mergeRes = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[12] mergeBack maxLevel:', mergeRes.maxLevel)

  const geom = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[12] geom after merge:', JSON.stringify(geom.result))
  filewrite(geom.result, 'geom-after')

  await snapshot('after')
  return { partId }
}
