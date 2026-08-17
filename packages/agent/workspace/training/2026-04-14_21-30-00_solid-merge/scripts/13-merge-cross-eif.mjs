// 13 — Can you merge solids from different EIFs? Or must they be in the same EIF?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossEIF' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eif1, length: 80, width: 50, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eif2, length: 60, width: 40, height: 60, translation: [50, 20, 0] })).result

  console.log('[13] box1:', box1, '(eif1:', eif1, ') box2:', box2, '(eif2:', eif2, ')')

  // Try merge with id=eif1 but tool from eif2
  const r = await api.v1.solid.merge({ id: eif1, target: box1, tools: [box2] })
  console.log('[13] cross-EIF merge result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[13] msgs:', JSON.stringify(r.messages))

  await snapshot('cross-eif')

  return { partId }
}
