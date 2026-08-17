export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Wrong ID type — pass part ID instead of shape ID
  const r1 = await api.v1.curve.circle({ id: partId, centerPos: [0, 0, 0], radius: 10 })
  console.log('[06] wrong ID (partId) maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Missing centerPos
  const r2 = await api.v1.curve.circle({ id: shapeId, radius: 10 })
  console.log('[06] missing centerPos maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Missing radius
  const r3 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0] })
  console.log('[06] missing radius maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Missing id
  const r4 = await api.v1.curve.circle({ centerPos: [0, 0, 0], radius: 10 })
  console.log('[06] missing id maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))

  // 2D point (only 2 values)
  const r5 = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0], radius: 10 })
  console.log('[06] 2D point maxLevel:', r5.maxLevel, 'messages:', JSON.stringify(r5.messages))

  filewrite({
    wrongId: { maxLevel: r1.maxLevel, messages: r1.messages },
    missingCenter: { maxLevel: r2.maxLevel, messages: r2.messages },
    missingRadius: { maxLevel: r3.maxLevel, messages: r3.messages },
    missingId: { maxLevel: r4.maxLevel, messages: r4.messages },
    point2D: { maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'error-cases')

  return { partId, shapeId }
}
