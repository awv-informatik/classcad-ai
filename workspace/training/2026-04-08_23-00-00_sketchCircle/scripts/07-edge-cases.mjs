// 07 — edge cases: zero radius, negative radius, non-zero Z, very small/large radius
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Zero radius
  const r1 = await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 0 })
  console.log('[07] zero radius: result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[07] messages:', JSON.stringify(r1.messages))

  // Negative radius
  const r2 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 0, 0], radius: -10 })
  console.log('[07] negative radius: result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[07] messages:', JSON.stringify(r2.messages))

  // Non-zero Z center
  const r3 = await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 5], radius: 10 })
  console.log('[07] non-zero Z: result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[07] messages:', JSON.stringify(r3.messages))

  // Very small radius
  const r4 = await api.v1.sketch.circle({ id: skId, centerPos: [50, 0, 0], radius: 0.001 })
  console.log('[07] micro radius (0.001): result:', r4.result, 'maxLevel:', r4.maxLevel)

  // Very large radius
  const r5 = await api.v1.sketch.circle({ id: skId, centerPos: [0, 50, 0], radius: 100000 })
  console.log('[07] huge radius (100000): result:', r5.result, 'maxLevel:', r5.maxLevel)

  await snapshot('edge-cases')
  return { partId }
}
