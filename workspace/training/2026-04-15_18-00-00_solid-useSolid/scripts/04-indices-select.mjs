// 04 — useSolid with indices: select specific solids from a multi-solid feature
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IndicesTest' })).result

  // Create an EI with multiple solids
  const srcEif = (await api.v1.part.entityInjection({ id: partId, name: 'MultiSolid' })).result
  const box1 = (await api.v1.solid.box({ id: srcEif, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: srcEif, length: 30, width: 30, height: 50, translation: [80, 0, 0] })).result
  const cyl1 = (await api.v1.solid.cylinder({ id: srcEif, height: 40, diameter: 25, translation: [0, 70, 0] })).result
  console.log('[04] source solids: box1:', box1, 'box2:', box2, 'cyl1:', cyl1)

  // Create destination EI
  const dstEif = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI' })).result

  // First: pull ALL solids (no indices) to see what we get
  const rAll = await api.v1.solid.useSolid({ from: [srcEif], in: dstEif })
  console.log('[04] useSolid ALL result:', rAll.result, 'maxLevel:', rAll.maxLevel)
  filewrite({ result: rAll.result, messages: rAll.messages, maxLevel: rAll.maxLevel }, 'useSolid-all')

  // Now create another dest EI and use indices to select only the first solid
  const dstEif2 = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI2' })).result
  const rIdx0 = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [0] }], in: dstEif2 })
  console.log('[04] useSolid index [0] result:', rIdx0.result, 'maxLevel:', rIdx0.maxLevel)
  filewrite({ result: rIdx0.result, messages: rIdx0.messages, maxLevel: rIdx0.maxLevel }, 'useSolid-index-0')

  // Select indices [1, 2] (second and third solid)
  const dstEif3 = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI3' })).result
  const rIdx12 = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [1, 2] }], in: dstEif3 })
  console.log('[04] useSolid indices [1,2] result:', rIdx12.result, 'maxLevel:', rIdx12.maxLevel)
  filewrite({ result: rIdx12.result, messages: rIdx12.messages, maxLevel: rIdx12.maxLevel }, 'useSolid-indices-1-2')

  // Edge case: invalid index (e.g., 5 — only 3 solids exist)
  const dstEif4 = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI4' })).result
  const rBad = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [5] }], in: dstEif4 })
  console.log('[04] useSolid bad index [5] result:', rBad.result, 'maxLevel:', rBad.maxLevel)
  console.log('[04] bad index messages:', JSON.stringify(rBad.messages))
  filewrite({ result: rBad.result, messages: rBad.messages, maxLevel: rBad.maxLevel }, 'useSolid-bad-index')

  await snapshot('indices-test')
  return { rAll: rAll.result, rIdx0: rIdx0.result, rIdx12: rIdx12.result, rBad: rBad.result }
}
