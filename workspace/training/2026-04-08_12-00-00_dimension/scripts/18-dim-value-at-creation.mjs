// Test: does value param at creation time work for OFFSET? (Script 06 didn't log maxLevel)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result

  // OFFSET with auto-value (should be 80)
  const r1 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })
  console.log('[18] OFFSET auto result:', r1.result, 'maxLevel:', r1.maxLevel)

  // OFFSET with numeric value = 100
  const r2 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[2]], value: 100 })
  console.log('[18] OFFSET value=100 result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[18] OFFSET value=100 messages:', JSON.stringify(r2.messages))

  // OFFSET with numeric value matching actual = 80
  const r3 = await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[1]], value: 50 })
  console.log('[18] OFFSET value=50 result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[18] OFFSET value=50 messages:', JSON.stringify(r3.messages))

  // HORIZONTAL_DISTANCE with value
  const r4 = await api.v1.sketch.dimension({ id: skId, type: 'HORIZONTAL_DISTANCE', geomIds: [rectIds[0]], value: 100 })
  console.log('[18] HDIST value=100 result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[18] HDIST messages:', JSON.stringify(r4.messages))

  // RADIUS with value on a circle
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [120, 30, 0], radius: 20 })).result
  const r5 = await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId], value: 30 })
  console.log('[18] RADIUS value=30 result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[18] RADIUS messages:', JSON.stringify(r5.messages))

  filewrite({
    offsetAuto: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    offsetValue100: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    offsetValue50: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    hdistValue100: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    radiusValue30: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'value-at-creation-responses')

  return { partId, skId }
}
