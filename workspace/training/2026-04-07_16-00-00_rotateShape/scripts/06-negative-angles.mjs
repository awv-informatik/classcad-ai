// 06 — Negative angles (clockwise vs counterclockwise)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NegativeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: positive 45° around Z (CCW)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Positive' })).result
  await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: -30, ya: 0 },
      { xa: -10, ya: 0 },
      { xa: -10, ya: 15 },
      { xa: -30, ya: 15 },
    ],
    close: true,
  })
  await api.v1.curve.rotateShape({ id: s1, rotation: [0, 0, Math.PI / 4] })

  // Shape 2: negative 45° around Z (CW)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Negative' })).result
  await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 10, ya: 0 },
      { xa: 30, ya: 0 },
      { xa: 30, ya: 15 },
      { xa: 10, ya: 15 },
    ],
    close: true,
  })
  const r = await api.v1.curve.rotateShape({ id: s2, rotation: [0, 0, -Math.PI / 4] })
  console.log('[06] negative rotation result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('positive-vs-negative')

  return { partId }
}
