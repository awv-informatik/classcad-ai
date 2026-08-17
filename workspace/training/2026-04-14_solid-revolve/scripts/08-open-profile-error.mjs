// Error case: open profile (not closed) — should fail
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OpenProfile' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Open polyline (close: false)
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Open' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 40, ya: 0 }, { xa: 55, ya: 0 },
      { xa: 55, ya: 15 }, { xa: 40, ya: 15 },
    ],
    close: false,
  })

  const r = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: shapeId,
  })

  console.log('[08] open profile result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] open profile messages:', JSON.stringify(r.messages))

  filewrite({
    result: r.result,
    maxLevel: r.maxLevel,
    messages: r.messages,
  }, 'open-profile-result')

  return { partId }
}
