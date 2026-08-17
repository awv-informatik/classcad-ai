// Test fractional scale factors: 0.5, 1.5, 2.5, 0.333
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleFractionalTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Four boxes, each scaled by different fractional factor
  const box1 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [60, 0, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [120, 0, 0] })).result
  const box4 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [180, 0, 0] })).result

  const r1 = await api.v1.solid.scale({ id: eifId, target: box1, factor: 0.5 })
  const r2 = await api.v1.solid.scale({ id: eifId, target: box2, factor: 1.5 })
  const r3 = await api.v1.solid.scale({ id: eifId, target: box3, factor: 2.5 })
  const r4 = await api.v1.solid.scale({ id: eifId, target: box4, factor: 0.333 })

  console.log('[15] 0.5x:', r1.result, r1.maxLevel)
  console.log('[15] 1.5x:', r2.result, r2.maxLevel)
  console.log('[15] 2.5x:', r3.result, r3.maxLevel)
  console.log('[15] 0.333x:', r4.result, r4.maxLevel)

  filewrite({
    half: { result: r1.result, maxLevel: r1.maxLevel },
    oneAndHalf: { result: r2.result, maxLevel: r2.maxLevel },
    twoAndHalf: { result: r3.result, maxLevel: r3.maxLevel },
    third: { result: r4.result, maxLevel: r4.maxLevel },
  }, 'fractional-responses')

  await snapshot('fractional-scales')

  return { partId, eifId }
}
