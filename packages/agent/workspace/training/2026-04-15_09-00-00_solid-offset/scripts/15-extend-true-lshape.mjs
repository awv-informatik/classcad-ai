// 15 — extend: TRUE on L-shape extrusion (compare to script 11 which used extend: FALSE)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtTrueLShape' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'LProfile' })).result
  await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 40, ya: 0 },
      { xa: 40, ya: 15 },
      { xa: 15, ya: 15 },
      { xa: 15, ya: 40 },
      { xa: 0, ya: 40 },
    ],
    close: true,
  })
  const extId = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 20], curves: shapeId })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 6, width: 6, height: 6, translation: [60, 0, 0] })).result

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: extId, distance: 3, extend: true })
  console.log('[15] extend=TRUE L-shape result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[15] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'ext-true-lshape-response')

  await snapshot('after')

  return { extId, result: r.result }
}
