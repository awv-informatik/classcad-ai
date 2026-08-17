// Edge cases: zero/negative dimensions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderDegenerate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Zero height
  const r1 = await api.v1.solid.cylinder({ id: eifId, height: 0, diameter: 50 })
  console.log('[05] zero height — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero-height')

  // Zero diameter
  const r2 = await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 0 })
  console.log('[05] zero diameter — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'zero-diameter')

  // Negative height
  const r3 = await api.v1.solid.cylinder({ id: eifId, height: -50, diameter: 50 })
  console.log('[05] negative height — result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'neg-height')

  // Negative diameter
  const r4 = await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: -50 })
  console.log('[05] negative diameter — result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'neg-diameter')

  await snapshot('degenerate')
  return { partId, eifId }
}
