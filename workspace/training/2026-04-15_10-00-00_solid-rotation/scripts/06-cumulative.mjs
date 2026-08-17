// Test if successive rotation calls are cumulative
// Two calls of π/4 around Z should equal one call of π/2 around Z
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CumulTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box 1: two separate π/4 rotations around Z
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [-60, 0, 0] })).result
  // Box 2: one π/2 rotation around Z
  const box2 = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [60, 0, 0] })).result
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 8, translation: [0, -60, 0] })).result

  await snapshot('before')

  // Box 1: two calls
  const r1a = await api.v1.solid.rotation({ id: eifId, target: box1, rotation: [0, 0, Math.PI / 4] })
  const r1b = await api.v1.solid.rotation({ id: eifId, target: box1, rotation: [0, 0, Math.PI / 4] })
  console.log('[06] box1 first:', r1a.result, r1a.maxLevel, '| second:', r1b.result, r1b.maxLevel)

  // Box 2: one call
  const r2 = await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [0, 0, Math.PI / 2] })
  console.log('[06] box2 single:', r2.result, r2.maxLevel)

  filewrite({
    box1_first: { result: r1a.result, maxLevel: r1a.maxLevel },
    box1_second: { result: r1b.result, maxLevel: r1b.maxLevel },
    box2_single: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'cumulative-results')

  await snapshot('after-cumulative-vs-single')
  return { box1, box2 }
}
