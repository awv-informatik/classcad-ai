// Test copyGeometry with multiple elements + inspect structure to find new IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyMulti' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines and a circle
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 40, 0] })).result
  const circ = (await api.v1.sketch.circle({ id: skId, center: [20, 20, 0], radius: 10 })).result
  console.log('[02] line1:', line1, 'line2:', line2, 'circ:', circ)

  // Get geometry before copy
  const geoBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[02] geometry count before:', geoBefore.result?.length)
  filewrite(geoBefore.result, 'geo-before')

  await snapshot('before')

  // Copy all three with translation
  const r = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [line1, line2, circ],
    translation: [60, 0, 0]
  })
  console.log('[02] copyGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copy-response')

  // Get geometry after copy
  const geoAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[02] geometry count after:', geoAfter.result?.length)
  filewrite(geoAfter.result, 'geo-after')

  await snapshot('after')

  return { partId }
}
