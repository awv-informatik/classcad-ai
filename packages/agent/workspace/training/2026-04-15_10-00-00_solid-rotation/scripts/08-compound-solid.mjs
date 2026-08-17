// Test rotation on compound solid (post-boolean union)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CompoundRot' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create L-shaped compound via union
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 20, height: 20 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 20, width: 60, height: 20 })).result
  await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })

  // Reference body
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 8, translation: [-40, -40, 0] })).result

  await snapshot('before-L-shape')

  const r = await api.v1.solid.rotation({ id: eifId, target: box1, rotation: [0, 0, Math.PI / 2] })
  console.log('[08] compound rotation result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'compound-rotation')

  await snapshot('after-compound-rotate')
  return { box1 }
}
