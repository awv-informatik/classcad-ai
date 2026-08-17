// Test scaling a consumed (boolean tool) solid — should error
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleConsumedTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [20, 5, 5] })).result

  // Union — box2 is consumed (keepTools defaults to false)
  await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })

  // Try to scale the consumed solid
  const r = await api.v1.solid.scale({ id: eifId, target: box2, factor: 2 })
  console.log('[12] scale consumed solid — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'consumed-solid-response')

  return { partId, eifId, box1, box2 }
}
