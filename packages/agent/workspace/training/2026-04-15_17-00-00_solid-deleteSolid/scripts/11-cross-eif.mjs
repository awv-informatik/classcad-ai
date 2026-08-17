// Test: delete a solid from a different EIF than it belongs to
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossEif' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result

  const box1 = (await api.v1.solid.box({ id: eif1, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eif2, length: 40, width: 40, height: 50 })).result
  console.log('[11] eif1:', eif1, 'eif2:', eif2, 'box1 (in eif1):', box1, 'box2 (in eif2):', box2)

  await snapshot('before')

  // Try to delete box1 (in eif1) using eif2 as the id param
  const r1 = await api.v1.solid.deleteSolid({ id: eif2, ids: [box1] })
  console.log('[11] cross-eif delete — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'cross-eif-response')

  await snapshot('after-cross-eif')

  // Try delete-all on eif1, see if box2 (in eif2) is affected
  const r2 = await api.v1.solid.deleteSolid({ id: eif1 })
  console.log('[11] delete all from eif1 — maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'delete-all-eif1')

  await snapshot('after-delete-all-eif1')

  return { partId, eif1, eif2 }
}
