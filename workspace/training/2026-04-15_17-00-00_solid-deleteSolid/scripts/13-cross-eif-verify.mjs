// Verify: cross-EIF specific deletion + delete-all scoping
// Use distinct shapes/positions so we can tell which survived visually and via data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossEifVerify' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result

  // Distinct shapes: box in eif1, sphere in eif2
  const boxId = (await api.v1.solid.box({ id: eif1, length: 60, width: 40, height: 30 })).result
  const sphereId = (await api.v1.solid.sphere({ id: eif2, radius: 25, translation: [80, 0, 0] })).result
  console.log('[13] eif1:', eif1, 'eif2:', eif2, 'boxId (in eif1):', boxId, 'sphereId (in eif2):', sphereId)

  await snapshot('before')

  // Delete the box (in eif1) via eif2 as context
  const r = await api.v1.solid.deleteSolid({ id: eif2, ids: [boxId] })
  console.log('[13] cross-eif delete box via eif2 — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'cross-eif-delete-box')

  await snapshot('after-cross-eif-delete')

  // Now delete-all from eif2 — should remove the sphere only
  const r2 = await api.v1.solid.deleteSolid({ id: eif2 })
  console.log('[13] delete all from eif2 — maxLevel:', r2.maxLevel)

  await snapshot('after-delete-all-eif2')

  return { partId, eif1, eif2 }
}
