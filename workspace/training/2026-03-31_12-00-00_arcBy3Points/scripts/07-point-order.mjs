// 07 - Does point order matter? Compare start/end swap and different midPos positions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Original' })).result
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Swapped' })).result
  const s3 = (await api.v1.curve.shape({ id: eifId, name: 'MidBelow' })).result

  // Original: start=left, mid=top, end=right → arc curves upward
  const r1 = await api.v1.curve.arcBy3Points({
    id: s1, startPos: [0, 0, 0], midPos: [25, 25, 0], endPos: [50, 0, 0],
  })
  console.log('[07] original maxLevel:', r1.maxLevel)

  // Swapped start/end: start=right, mid=top, end=left
  const r2 = await api.v1.curve.arcBy3Points({
    id: s2, startPos: [50, 40, 0], midPos: [25, 65, 0], endPos: [0, 40, 0],
  })
  console.log('[07] swapped maxLevel:', r2.maxLevel)

  // Mid below: same start/end, mid below the line → arc curves downward
  const r3 = await api.v1.curve.arcBy3Points({
    id: s3, startPos: [0, -40, 0], midPos: [25, -65, 0], endPos: [50, -40, 0],
  })
  console.log('[07] mid-below maxLevel:', r3.maxLevel)

  await snapshot('point-order')
  return { partId }
}
