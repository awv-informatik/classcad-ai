// Test scaling a compound solid (post-boolean union)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleCompoundTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create two overlapping boxes, union them
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 60, height: 20, translation: [30, -10, 10] })).result
  await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })

  // Reference body
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [120, 0, 0] })).result

  await snapshot('before-compound-scale')

  // Scale the compound by 1.5
  const r = await api.v1.solid.scale({ id: eifId, target: box1, factor: 1.5 })
  console.log('[08] scale compound result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'compound-scale-response')

  await snapshot('after-compound-scale')

  return { partId, eifId, box1 }
}
