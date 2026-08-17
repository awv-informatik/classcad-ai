// 06 — Offset on a cone (interesting case: top face is smaller)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConeOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Cone with different top/bottom diameters + reference
  const coneId = (await api.v1.solid.cone({ id: eifId, height: 40, bDiameter: 40, tDiameter: 10 })).result
  const refId = (await api.v1.solid.box({ id: eifId, length: 8, width: 8, height: 8, translation: [50, 0, 0] })).result
  console.log('[06] coneId:', coneId, 'refId:', refId)

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: coneId, distance: 5 })
  console.log('[06] cone offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cone-offset-response')

  await snapshot('after')

  return { coneId, result: r.result }
}
