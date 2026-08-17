// Test copyGeometry with multiple elements — fixed circle param + getGeometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyMulti2' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines and a circle (centerPos, not center!)
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 40, 0] })).result
  const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [20, 20, 0], radius: 10 })).result
  console.log('[03] line1:', line1, 'line2:', line2, 'circ:', circ)

  await snapshot('before')

  // Copy all three with translation
  const r = await api.v1.sketch.copyGeometry({
    id: skId,
    geomIds: [line1, line2, circ],
    translation: [60, 0, 0]
  })
  console.log('[03] copyGeometry result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copy-response')

  await snapshot('after')

  return { partId }
}
