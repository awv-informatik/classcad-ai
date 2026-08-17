// Test: pass empty ids array — what happens?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyIds' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[06] boxId:', boxId)

  // Pass empty ids array
  const r = await api.v1.solid.deleteSolid({ id: eifId, ids: [] })
  console.log('[06] empty ids — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-ids-response')

  await snapshot('after-empty-ids')

  return { partId, eifId, boxId }
}
