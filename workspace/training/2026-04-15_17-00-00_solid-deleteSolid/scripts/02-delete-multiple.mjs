// Delete multiple specific solids via ids array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteMultiple' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create three boxes
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 70, translation: [0, 80, 0] })).result
  console.log('[02] box1:', box1, 'box2:', box2, 'box3:', box3)

  await snapshot('before')

  // Delete box1 and box3, keep box2
  const r = await api.v1.solid.deleteSolid({ id: eifId, ids: [box1, box3] })
  console.log('[02] deleteSolid result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-multi-response')

  await snapshot('after')

  return { partId, eifId, box2 }
}
