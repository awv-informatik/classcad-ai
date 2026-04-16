// Test double-delete: delete a solid, then try to delete it again
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DoubleDelete' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[05] boxId:', boxId)

  // First delete — should succeed
  const r1 = await api.v1.solid.deleteSolid({ id: eifId, ids: [boxId] })
  console.log('[05] first delete — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'first-delete')

  // Second delete — box already gone
  const r2 = await api.v1.solid.deleteSolid({ id: eifId, ids: [boxId] })
  console.log('[05] second delete — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'second-delete')

  return { partId, eifId }
}
