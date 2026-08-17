// 09 — Translate a consumed tool solid (after boolean with keepTools=false)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConsumedTool' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 40 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [20, 20, 0] })).result

  // Union consumes box2
  await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })

  // Try to translate the consumed tool
  const r = await api.v1.solid.translation({ id: eifId, target: box2, translation: [10, 0, 0] })
  console.log('[09] consumed tool translate — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'consumed-tool-response')

  return { box1, box2 }
}
