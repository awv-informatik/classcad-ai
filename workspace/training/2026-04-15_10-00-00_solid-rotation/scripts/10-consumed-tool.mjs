// Test rotating a consumed tool solid (should fail)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConsumedTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [20, 20, 0] })).result

  // Union consumes box2
  await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })

  // Now try to rotate consumed box2
  const r = await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [0, 0, Math.PI / 4] })
  console.log('[10] consumed tool rotation:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] msg:', r.messages?.[0]?.message)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'consumed-tool')

  return { box1, box2 }
}
