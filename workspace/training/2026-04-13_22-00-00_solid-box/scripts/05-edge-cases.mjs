export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test zero dimension
  const r1 = await api.v1.solid.box({ id: eifId, length: 0, width: 50, height: 50 })
  console.log('[05] zero length:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[05] zero length messages:', JSON.stringify(r1.messages))

  // Test negative dimension
  const r2 = await api.v1.solid.box({ id: eifId, length: -50, width: 50, height: 50 })
  console.log('[05] negative length:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[05] negative length messages:', JSON.stringify(r2.messages))

  // Test very small dimension
  const r3 = await api.v1.solid.box({ id: eifId, length: 0.001, width: 50, height: 50 })
  console.log('[05] tiny length (0.001):', r3.result, 'maxLevel:', r3.maxLevel)

  // Test very large dimension
  const r4 = await api.v1.solid.box({ id: eifId, length: 100000, width: 100000, height: 100000 })
  console.log('[05] huge box:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    zero: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    negative: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    tiny: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    huge: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'edge-cases')

  await snapshot('edge-cases')
  return { partId }
}
