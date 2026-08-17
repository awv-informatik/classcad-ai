// 12 — Offset on a revolved solid (torus-like)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RevolveOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a small rectangle profile and revolve it around Y axis to make a torus
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'RevProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 25, ya: -5 },
      { xa: 35, ya: -5 },
      { xa: 35, ya: 5 },
      { xa: 25, ya: 5 },
    ],
    close: true,
  })
  const revId = (await api.v1.solid.revolve({
    id: eifId,
    originPos: [0, 0, 0],
    direction: [0, 1, 0],
    angle: 6.283185,
    curves: shapeId,
  })).result
  console.log('[12] revId:', revId)

  // Reference
  const refId = (await api.v1.solid.box({ id: eifId, length: 6, width: 6, height: 6, translation: [50, 0, 0] })).result

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: revId, distance: 3 })
  console.log('[12] revolve offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'revolve-offset-response')

  await snapshot('after')

  return { revId, result: r.result }
}
