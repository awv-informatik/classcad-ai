// Test cumulative scaling: two successive scale calls
// Factor 2 then factor 3 should equal factor 6 total
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleCumulativeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Two boxes: one gets 2x then 3x, other gets 6x directly
  const box1 = (await api.v1.solid.box({ id: eifId, length: 20, width: 15, height: 10 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 20, width: 15, height: 10, translation: [0, 80, 0] })).result
  // Reference sphere
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 5, translation: [150, 0, 0] })).result

  await snapshot('before-cumulative')

  // Box1: scale 2x then 3x
  const r1a = await api.v1.solid.scale({ id: eifId, target: box1, factor: 2 })
  console.log('[06] first scale 2x result:', r1a.result, 'maxLevel:', r1a.maxLevel)
  const r1b = await api.v1.solid.scale({ id: eifId, target: box1, factor: 3 })
  console.log('[06] second scale 3x result:', r1b.result, 'maxLevel:', r1b.maxLevel)

  // Box2: scale 6x directly
  const r2 = await api.v1.solid.scale({ id: eifId, target: box2, factor: 6 })
  console.log('[06] direct scale 6x result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('after-cumulative')

  filewrite({
    box1_step1: { result: r1a.result, maxLevel: r1a.maxLevel },
    box1_step2: { result: r1b.result, maxLevel: r1b.maxLevel },
    box2_direct: { result: r2.result, maxLevel: r2.maxLevel }
  }, 'cumulative-responses')

  return { partId, eifId, box1, box2 }
}
