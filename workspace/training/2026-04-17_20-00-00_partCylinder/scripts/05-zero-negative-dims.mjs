export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylEdge' })).result

  // Zero diameter
  const r1 = await api.v1.part.cylinder({ id: partId, name: 'ZeroDiam', diameter: 0, height: 50 })
  console.log('[05] zero diameter result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[05] zero diameter msgs:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero-diameter')

  // Negative diameter
  const r2 = await api.v1.part.cylinder({ id: partId, name: 'NegDiam', diameter: -50, height: 50 })
  console.log('[05] neg diameter result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] neg diameter msgs:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'neg-diameter')

  // Zero height
  const r3 = await api.v1.part.cylinder({ id: partId, name: 'ZeroHeight', diameter: 50, height: 0 })
  console.log('[05] zero height result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[05] zero height msgs:', JSON.stringify(r3.messages))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'zero-height')

  // Negative height
  const r4 = await api.v1.part.cylinder({ id: partId, name: 'NegHeight', diameter: 50, height: -80 })
  console.log('[05] neg height result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[05] neg height msgs:', JSON.stringify(r4.messages))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'neg-height')

  return { partId }
}
