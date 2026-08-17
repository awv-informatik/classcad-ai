// Edge case: invalid ID, sketch ID, part ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a line so the sketch has content
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result

  // Test 1: pass sketch ID instead of curve ID
  const r1 = await api.v1.sketch.getPoints({ id: skId })
  console.log('[08] sketchId:', JSON.stringify({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }))

  // Test 2: pass part ID
  const r2 = await api.v1.sketch.getPoints({ id: partId })
  console.log('[08] partId:', JSON.stringify({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }))

  // Test 3: pass bogus ID (99999)
  const r3 = await api.v1.sketch.getPoints({ id: 99999 })
  console.log('[08] bogusId:', JSON.stringify({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }))

  filewrite({
    sketchId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    bogusId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'invalid-ids')

  return { partId }
}
