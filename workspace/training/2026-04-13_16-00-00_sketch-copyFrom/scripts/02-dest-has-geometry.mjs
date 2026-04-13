// Test copyFrom when destination sketch already has geometry — does it merge or replace?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyFromMerge' })).result

  // Source sketch: rectangle at origin
  const srcSkId = (await api.v1.sketch.create({ id: partId })).result
  await api.v1.sketch.rectangle({ id: srcSkId, startPos: [0, 0, 0], endPos: [40, 30, 0] })

  // Destination sketch: circle at offset position
  const dstSkId = (await api.v1.sketch.create({ id: partId })).result
  const circId = (await api.v1.sketch.circle({ id: dstSkId, centerPos: [80, 15, 0], radius: 15 })).result
  console.log('[02] dest circle before copy:', circId)

  await snapshot('dest-before')

  // Copy source into destination (which already has a circle)
  const r = await api.v1.sketch.copyFrom({ id: dstSkId, toCopyId: srcSkId })
  console.log('[02] copyFrom result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('dest-after')

  // Dump structure to see if both circle and rectangle exist in dest
  const structR = await api.v1.common.getStructure({})
  filewrite(structR.structure, 'structure-after-copy')

  return { partId }
}
