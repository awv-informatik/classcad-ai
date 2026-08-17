// 02 — Two shapes side by side: original + rotated, for visual comparison
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CompareTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Shape 1: reference (untouched)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Original' })).result
  await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: -50, ya: 0 },
      { xa: -10, ya: 0 },
      { xa: -10, ya: 10 },
      { xa: -40, ya: 10 },
      { xa: -40, ya: 30 },
      { xa: -50, ya: 30 },
    ],
    close: true,
  })

  // Shape 2: will be rotated
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Rotated' })).result
  await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 10, ya: 0 },
      { xa: 50, ya: 0 },
      { xa: 50, ya: 10 },
      { xa: 20, ya: 10 },
      { xa: 20, ya: 30 },
      { xa: 10, ya: 30 },
    ],
    close: true,
  })

  // Rotate shape 2 by 45° around Z
  const r = await api.v1.curve.rotateShape({ id: s2, rotation: [0, 0, Math.PI / 4] })
  console.log('[02] rotateShape 45° Z result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('original-left-rotated-right')

  return { partId }
}
