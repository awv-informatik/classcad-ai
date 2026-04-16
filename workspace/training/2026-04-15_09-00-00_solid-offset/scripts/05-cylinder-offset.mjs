// 05 — Offset on a cylinder
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Cylinder + reference
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 30 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 8, width: 8, height: 8, translation: [50, 0, 0] })).result
  console.log('[05] cylId:', cylId, 'refId:', refId)

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: cylId, distance: 5 })
  console.log('[05] cylinder offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cylinder-offset-response')

  await snapshot('after')

  return { cylId, result: r.result }
}
