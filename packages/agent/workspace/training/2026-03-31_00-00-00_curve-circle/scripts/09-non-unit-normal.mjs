export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Non-unit normal — does it normalize automatically?
  const r1 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20, normal: [0, 0, 5] })
  console.log('[09] non-unit [0,0,5] maxLevel:', r1.maxLevel)

  // Very small normal
  const r2 = await api.v1.curve.circle({ id: shapeId, centerPos: [50, 0, 0], radius: 15, normal: [0, 0, 0.001] })
  console.log('[09] tiny [0,0,0.001] maxLevel:', r2.maxLevel)

  // Zero normal [0,0,0]
  const r3 = await api.v1.curve.circle({ id: shapeId, centerPos: [100, 0, 0], radius: 10, normal: [0, 0, 0] })
  console.log('[09] zero normal [0,0,0] maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Negative normal — should flip circle orientation
  const r4 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 50, 0], radius: 15, normal: [0, 0, -1] })
  console.log('[09] negative [0,0,-1] maxLevel:', r4.maxLevel)

  filewrite({
    nonUnit: { maxLevel: r1.maxLevel, messages: r1.messages },
    tiny: { maxLevel: r2.maxLevel, messages: r2.messages },
    zero: { maxLevel: r3.maxLevel, messages: r3.messages },
    negative: { maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'normal-edge-cases')

  await snapshot('normal-edge-cases')
  return { partId, shapeId }
}
