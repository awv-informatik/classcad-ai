export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Very small radius
  const r1 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 0.001 })
  console.log('[04] tiny radius 0.001 maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Zero radius
  const r2 = await api.v1.curve.circle({ id: shapeId, centerPos: [20, 0, 0], radius: 0 })
  console.log('[04] zero radius maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Negative radius
  const r3 = await api.v1.curve.circle({ id: shapeId, centerPos: [40, 0, 0], radius: -10 })
  console.log('[04] negative radius maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Very large radius
  const r4 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 30, 0], radius: 100000 })
  console.log('[04] large radius 100000 maxLevel:', r4.maxLevel)

  filewrite({
    tiny: { maxLevel: r1.maxLevel, messages: r1.messages },
    zero: { maxLevel: r2.maxLevel, messages: r2.messages },
    negative: { maxLevel: r3.maxLevel, messages: r3.messages },
    large: { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'radius-edge-cases')

  await snapshot('radius-edge-cases')
  return { partId, shapeId }
}
