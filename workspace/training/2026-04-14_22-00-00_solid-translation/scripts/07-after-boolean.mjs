// 07 — Translate a solid after a boolean union (compound solid)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AfterBoolean' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 20, diameter: 15 })).result

  // Two boxes to union
  const box1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40, translation: [30, 0, 0] })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 60, translation: [50, 10, 0] })).result

  // Union them
  const unionR = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })
  console.log('[07] union result:', unionR.result, 'maxLevel:', unionR.maxLevel)

  await snapshot('after-union')

  // Translate the compound solid
  const r = await api.v1.solid.translation({ id: eifId, target: box1, translation: [40, 40, 0] })
  console.log('[07] translate compound result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-translate-compound')

  filewrite({ unionResult: unionR.result, translateResult: r.result, maxLevel: r.maxLevel }, 'boolean-translate')

  return { partId, eifId }
}
