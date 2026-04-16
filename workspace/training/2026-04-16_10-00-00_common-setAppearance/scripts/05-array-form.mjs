// Test array form — batch multiple targets in one call
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArrayFormTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  const eifId2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result
  const box2 = (await api.v1.solid.box({ id: eifId2, length: 30, width: 30, height: 30 })).result

  console.log('[05] eifId:', eifId, 'eifId2:', eifId2)

  // Array form: set different colors on different features at once
  const r1 = await api.v1.common.setAppearance([
    { target: eifId, color: [255, 0, 0], transparency: 0.3 },
    { target: eifId2, color: [0, 0, 255], transparency: 0.6 },
  ])
  console.log('[05] array form result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'array-form')

  // Array form with object target (indices)
  const r2 = await api.v1.common.setAppearance([
    { target: { id: eifId, indices: [0] }, color: [0, 255, 0] },
  ])
  console.log('[05] array form + indices result:', r2.result, 'maxLevel:', r2.maxLevel)

  return { partId }
}
