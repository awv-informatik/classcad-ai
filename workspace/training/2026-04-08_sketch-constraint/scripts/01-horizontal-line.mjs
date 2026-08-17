// Test HORIZONTAL constraint on a line
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a slightly diagonal line (not axis-aligned to avoid auto-constraints)
  const lineId = (await api.v1.sketch.line({
    id: skId,
    startPos: [10, 5, 0],
    endPos: [60, 8, 0],
    genVertAndHoriz: false,
    genFixation: false,
  })).result
  console.log('[01] lineId:', lineId)

  // Apply HORIZONTAL constraint to the line
  const r = await api.v1.sketch.constraint({
    id: skId,
    type: 'HORIZONTAL',
    geomIds: [lineId],
  })
  console.log('[01] constraint result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'horizontal-response')

  await snapshot('horizontal')
  return { partId, skId, lineId, constraintId: r.result }
}
