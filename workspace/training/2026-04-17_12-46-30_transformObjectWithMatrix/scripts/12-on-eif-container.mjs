export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ContainerTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Two boxes in same EIF
  const box1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 15, width: 15, height: 15, translation: [40, 0, 0] })).result

  await snapshot('before')

  // Transform the EIF container — should move ALL children
  const r = await api.v1.common.transformObjectWithMatrix({
    id: eifId,
    matrix: [
      [0, -1, 0, 50],
      [1,  0, 0, 50],
      [0,  0, 1,  0],
      [0,  0, 0,  1],
    ],
  })

  console.log('[12] container transform result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[12] messages:', JSON.stringify(r.messages))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'container-response')

  await snapshot('after')

  return { partId }
}
