// 09 — Offset on a solid after boolean subtraction (complex topology)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create box with a cylinder hole
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 15, translation: [30, 20, -5] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })
  console.log('[09] boxId after subtraction:', boxId)

  // Reference body
  const refId = (await api.v1.solid.box({ id: eifId, length: 8, width: 8, height: 8, translation: [80, 0, 0] })).result

  await snapshot('before-bool-offset')

  // Try to offset the boolean result
  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 3 })
  console.log('[09] bool offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'bool-offset-response')

  await snapshot('after-bool-offset')

  return { boxId, result: r.result }
}
