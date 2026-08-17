// Delete ALL solids (no ids param)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteAll' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create three boxes
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 70, translation: [0, 80, 0] })).result
  console.log('[03] created box1:', box1, 'box2:', box2, 'box3:', box3)

  await snapshot('before')

  // Delete ALL solids — omit ids
  const r = await api.v1.solid.deleteSolid({ id: eifId })
  console.log('[03] deleteSolid (all) result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-all-response')
  filewrite(r.graphic, 'graphic-after-all')

  await snapshot('after-all')

  return { partId, eifId }
}
