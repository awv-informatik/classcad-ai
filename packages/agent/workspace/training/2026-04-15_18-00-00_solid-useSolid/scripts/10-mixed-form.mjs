// 10 — Mixed from array: some plain IDs, some with indices
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedForm' })).result

  // Source 1: part-level box (single solid)
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Source 2: EI with 2 solids
  const srcEif = (await api.v1.part.entityInjection({ id: partId, name: 'SrcEI' })).result
  const cyl1 = (await api.v1.solid.cylinder({ id: srcEif, height: 40, diameter: 25, translation: [100, 0, 0] })).result
  const sph1 = (await api.v1.solid.sphere({ id: srcEif, radius: 15, translation: [100, 60, 0] })).result
  console.log('[10] box1 feat:', box1, 'srcEif:', srcEif, 'cyl1:', cyl1, 'sph1:', sph1)

  // Mix: plain ID for box1, object with indices for srcEif (just first solid)
  const eif = (await api.v1.part.entityInjection({ id: partId, name: 'Dest' })).result
  const r = await api.v1.solid.useSolid({
    from: [box1, { id: srcEif, indices: [0] }],
    in: eif
  })
  console.log('[10] mixed useSolid result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-form')

  await snapshot('mixed-form')
  return { result: r.result }
}
