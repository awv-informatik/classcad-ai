// Error case: passing wrong ID type (part ID instead of EIF ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongId' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 40, ya: 0 }, { xa: 55, ya: 0 },
      { xa: 55, ya: 15 }, { xa: 40, ya: 15 },
    ],
    close: true,
  })

  // Wrong: passing partId instead of eifId
  const r = await api.v1.solid.revolve({
    id: partId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: shapeId,
  })

  console.log('[12] wrong ID type result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'wrong-id-result')
  return { partId }
}
