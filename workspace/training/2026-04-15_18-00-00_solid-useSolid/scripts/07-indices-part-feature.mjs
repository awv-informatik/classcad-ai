// 07 — Test indices on a part-level feature (part.box has exactly one solid)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IndicesPartFeat' })).result

  // Create a part-level box (feature with one solid)
  const boxFeat = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[07] box feature:', boxFeat)

  // Try indices [0] on part-level box feature
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EI1' })).result
  const r0 = await api.v1.solid.useSolid({ from: [{ id: boxFeat, indices: [0] }], in: eif1 })
  console.log('[07] indices [0] on part.box: result:', r0.result, 'maxLevel:', r0.maxLevel)
  console.log('[07] messages:', JSON.stringify(r0.messages))
  filewrite({ result: r0.result, messages: r0.messages, maxLevel: r0.maxLevel }, 'indices-0-part-box')

  // Try indices [1] — should fail (box has only 1 solid)
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EI2' })).result
  const r1 = await api.v1.solid.useSolid({ from: [{ id: boxFeat, indices: [1] }], in: eif2 })
  console.log('[07] indices [1] on part.box: result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'indices-1-part-box')

  await snapshot('indices-part-feature')
  return { r0: r0.result, r1: r1.result }
}
