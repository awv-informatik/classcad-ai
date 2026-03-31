// 02 — Rename an entity injection feature
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF_Original' })).result
  console.log('[02] partId:', partId, 'eifId:', eifId)

  // Rename the entity injection
  const r = await api.v1.common.setObjectName({ id: eifId, name: 'EIF_Renamed' })
  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)

  // Check structure to verify
  filewrite(r.structure, 'structure-after')

  return { partId, eifId }
}
