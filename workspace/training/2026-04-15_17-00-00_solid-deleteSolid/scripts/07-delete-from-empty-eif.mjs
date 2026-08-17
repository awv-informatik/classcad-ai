// Test: delete all from an EIF that has no solids
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptyEif' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  console.log('[07] eifId:', eifId)

  // Delete all from empty EIF
  const r = await api.v1.solid.deleteSolid({ id: eifId })
  console.log('[07] delete from empty — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-empty-response')

  return { partId, eifId }
}
