export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidTest' })).result

  // Invalid ID
  const r1 = await api.v1.part.calculateMassProperties({ id: 99999 })
  console.log('[08] invalidId result:', JSON.stringify(r1.result))
  console.log('[08] invalidId maxLevel:', r1.maxLevel)
  console.log('[08] invalidId messages:', JSON.stringify(r1.messages))

  // Zero ID
  const r2 = await api.v1.part.calculateMassProperties({ id: 0 })
  console.log('[08] zeroId result:', JSON.stringify(r2.result))
  console.log('[08] zeroId maxLevel:', r2.maxLevel)

  // Sketch ID (not a solid)
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const r3 = await api.v1.part.calculateMassProperties({ id: skId })
  console.log('[08] sketchId result:', JSON.stringify(r3.result))
  console.log('[08] sketchId maxLevel:', r3.maxLevel)
  console.log('[08] sketchId messages:', JSON.stringify(r3.messages))

  // Work plane ID
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 0], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  const r4 = await api.v1.part.calculateMassProperties({ id: wpId })
  console.log('[08] workPlane result:', JSON.stringify(r4.result))
  console.log('[08] workPlane maxLevel:', r4.maxLevel)
  console.log('[08] workPlane messages:', JSON.stringify(r4.messages))

  filewrite({
    invalidId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    zeroId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    sketchId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    workPlane: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'invalid-ids')

  return { partId }
}
