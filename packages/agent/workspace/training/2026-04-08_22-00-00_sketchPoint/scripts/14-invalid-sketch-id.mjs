// Error handling: invalid sketch ID, missing params
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result

  // Pass part ID instead of sketch ID
  const r1 = await api.v1.sketch.point({ id: partId, pos: [10, 10, 0] })
  console.log('[14] partId as sketch — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[14] messages:', JSON.stringify(r1.messages))

  // Pass invalid ID
  const r2 = await api.v1.sketch.point({ id: 99999, pos: [10, 10, 0] })
  console.log('[14] invalid id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[14] messages:', JSON.stringify(r2.messages))

  // Missing pos
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const r3 = await api.v1.sketch.point({ id: skId })
  console.log('[14] missing pos — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[14] messages:', JSON.stringify(r3.messages))

  // Missing id
  const r4 = await api.v1.sketch.point({ pos: [10, 10, 0] })
  console.log('[14] missing id — result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[14] messages:', JSON.stringify(r4.messages))

  filewrite({
    partIdAsSketch: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    missingPos: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    missingId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'error-cases')

  return { partId, skId }
}
