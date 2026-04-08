// 11 — Interaction: translate then rotate (is rotation around origin or around shape center?)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InteractionTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: just rotate (reference)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'JustRotate' })).result
  await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 15, ya: 0 },
      { xa: 15, ya: 10 },
      { xa: 0, ya: 10 },
    ],
    close: true,
  })
  await api.v1.curve.rotateShape({ id: s1, rotation: [0, 0, Math.PI / 4] })

  // Shape 2: translate first, then rotate (different result if rotation is around origin)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'TranslateThenRotate' })).result
  await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 15, ya: 0 },
      { xa: 15, ya: 10 },
      { xa: 0, ya: 10 },
    ],
    close: true,
  })
  await api.v1.curve.translateShape({ id: s2, translation: [30, 0, 0] })
  const r = await api.v1.curve.rotateShape({ id: s2, rotation: [0, 0, Math.PI / 4] })
  console.log('[11] translate+rotate result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('translate-then-rotate')

  return { partId }
}
