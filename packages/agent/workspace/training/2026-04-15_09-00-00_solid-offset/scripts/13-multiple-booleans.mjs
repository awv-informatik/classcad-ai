// 13 — Offset on a solid with multiple boolean operations (complex topology — likely to fail)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiBoolOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Base box
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Multiple cylinder holes at different positions
  const cyl1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const cyl2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const cyl3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result

  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cyl1, cyl2, cyl3] })
  console.log('[13] boxId after 3 subtractions:', boxId)

  const refId = (await api.v1.solid.box({ id: eifId, length: 6, width: 6, height: 6, translation: [80, 0, 0] })).result

  await snapshot('before')

  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 2 })
  console.log('[13] multi-bool offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-bool-response')

  await snapshot('after')

  return { boxId, result: r.result }
}
