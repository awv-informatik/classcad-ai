// Verify: delete-all is scoped to the specific EIF (doesn't cross boundaries)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteAllScoped' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result

  // Two boxes in eif1, one in eif2
  const b1 = (await api.v1.solid.box({ id: eif1, length: 60, width: 40, height: 30 })).result
  const b2 = (await api.v1.solid.box({ id: eif1, length: 30, width: 30, height: 60, translation: [80, 0, 0] })).result
  const b3 = (await api.v1.solid.box({ id: eif2, length: 40, width: 40, height: 40, translation: [0, 80, 0] })).result
  console.log('[14] b1 (eif1):', b1, 'b2 (eif1):', b2, 'b3 (eif2):', b3)

  await snapshot('before-3boxes')

  // Delete all from eif1 — should remove b1 and b2, keep b3
  const r = await api.v1.solid.deleteSolid({ id: eif1 })
  console.log('[14] delete all from eif1 — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-all-eif1')

  await snapshot('after-delete-all-eif1')

  return { partId, eif1, eif2, b3 }
}
