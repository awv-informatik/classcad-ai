export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PointTypes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'PT' })).result

  // Test: 2-element point (missing Z)
  const r1 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0], endPos: [10, 10] })
  console.log('[12] 2-element point result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[12] 2-element messages:', JSON.stringify(r1.messages))

  // Test: 4-element point (extra element)
  const r2 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0, 0], endPos: [10, 10, 0, 0] })
  console.log('[12] 4-element point result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[12] 4-element messages:', JSON.stringify(r2.messages))

  // Test: single value
  const r3 = await api.v1.curve.line({ id: shapeId, startPos: [0], endPos: [10] })
  console.log('[12] 1-element point result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[12] 1-element messages:', JSON.stringify(r3.messages))

  filewrite({
    twoElement: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    fourElement: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    oneElement: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'point-types')

  await snapshot('point-types')
  return { partId, shapeId }
}
