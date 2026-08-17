// Test large angles: > 2π (full revolution), and exact multiples of π
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeAngle' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20 })).result
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 8, translation: [-50, -50, 0] })).result

  await snapshot('before')

  // Full revolution (2π) — should look the same
  const r1 = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, 2 * Math.PI] })
  console.log('[07] full revolution result:', r1.result, 'maxLevel:', r1.maxLevel)
  await snapshot('after-full-revolution')

  // Additional 3π rotation (540°) — equivalent to π = 180°
  const r2 = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, 3 * Math.PI] })
  console.log('[07] 3π rotation result:', r2.result, 'maxLevel:', r2.maxLevel)
  await snapshot('after-3pi')

  // 10π rotation (5 full revolutions)
  const r3 = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, 10 * Math.PI] })
  console.log('[07] 10π rotation result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    fullRev: { result: r1.result, maxLevel: r1.maxLevel },
    threePi: { result: r2.result, maxLevel: r2.maxLevel },
    tenPi: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'large-angles')

  await snapshot('after-10pi')
  return { boxId }
}
