// Test negative rotation angles — should rotate in the opposite direction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegAngle' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Two identical boxes side by side — one rotated +45°, one rotated -45° around Z
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [-60, 0, 0] })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [60, 0, 0] })).result
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 8, translation: [0, -60, 0] })).result

  await snapshot('before')

  const r1 = await api.v1.solid.rotation({ id: eifId, target: box1, rotation: [0, 0, Math.PI / 4] })
  const r2 = await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [0, 0, -Math.PI / 4] })
  console.log('[05] positive:', r1.result, r1.maxLevel, '| negative:', r2.result, r2.maxLevel)
  filewrite({
    positive: { result: r1.result, maxLevel: r1.maxLevel },
    negative: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'neg-angles')

  await snapshot('after-pos-and-neg-45')
  return { box1, box2 }
}
