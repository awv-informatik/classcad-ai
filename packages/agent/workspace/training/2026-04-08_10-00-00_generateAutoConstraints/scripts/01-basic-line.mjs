// Test generateAutoConstraints on a near-horizontal line
// Question: What constraints does it generate? Does it detect near-horizontal?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a near-horizontal line (slight slope) — disable auto-gen on creation
  const lineR = await api.v1.sketch.line({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [50, 1, 0],
    genFixation: false,
    genVertAndHoriz: false,
  })
  const lineId = lineR.result
  console.log('[01] lineId:', lineId)
  filewrite(lineR.structure, 'structure-after-line')

  // Now generate auto-constraints on this line
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: lineId })
  console.log('[01] generateAutoConstraints result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'auto-result')
  filewrite(r.structure, 'structure-after-auto')

  await snapshot('after-auto')
  return { partId }
}
