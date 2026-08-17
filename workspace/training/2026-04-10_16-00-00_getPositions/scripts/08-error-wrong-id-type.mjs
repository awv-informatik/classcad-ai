// Error cases: wrong ID types (part, sketch), invalid ID, missing param
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Case 1: pass sketch ID
  const r1 = await api.v1.sketch.getPositions({ id: skId })
  console.log('[08a] sketch ID — maxLevel:', r1.maxLevel, 'result:', JSON.stringify(r1.result))
  console.log('[08a] messages:', JSON.stringify(r1.messages))

  // Case 2: pass part ID
  const r2 = await api.v1.sketch.getPositions({ id: partId })
  console.log('[08b] part ID — maxLevel:', r2.maxLevel, 'result:', JSON.stringify(r2.result))
  console.log('[08b] messages:', JSON.stringify(r2.messages))

  // Case 3: invalid ID (bogus number)
  const r3 = await api.v1.sketch.getPositions({ id: 99999 })
  console.log('[08c] bogus ID — maxLevel:', r3.maxLevel, 'result:', JSON.stringify(r3.result))
  console.log('[08c] messages:', JSON.stringify(r3.messages))

  // Case 4: missing id param
  const r4 = await api.v1.sketch.getPositions({})
  console.log('[08d] missing ID — maxLevel:', r4.maxLevel, 'result:', JSON.stringify(r4.result))
  console.log('[08d] messages:', JSON.stringify(r4.messages))

  filewrite({
    sketchId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    partId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    bogusId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    missingId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'error-cases')

  return { partId }
}
