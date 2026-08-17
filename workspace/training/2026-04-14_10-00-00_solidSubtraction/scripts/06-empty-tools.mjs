// Test empty tools array and chained subtractions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubEdge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  // Empty tools array
  const r1 = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [] })
  console.log('[06] empty tools — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Chained subtractions on same target
  const cyl1 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 15,
    translation: [25, 40, -10]
  })).result

  const r2 = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl1] })
  console.log('[06] chain 1 — result:', r2.result, 'maxLevel:', r2.maxLevel)

  const cyl2 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 15,
    translation: [50, 40, -10]
  })).result

  const r3 = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl2] })
  console.log('[06] chain 2 — result:', r3.result, 'maxLevel:', r3.maxLevel)

  const cyl3 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 15,
    translation: [75, 40, -10]
  })).result

  const r4 = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl3] })
  console.log('[06] chain 3 — result:', r4.result, 'maxLevel:', r4.maxLevel)

  await snapshot('chained')

  filewrite({
    emptyTools: { result: r1.result, maxLevel: r1.maxLevel },
    chain1: { result: r2.result, maxLevel: r2.maxLevel },
    chain2: { result: r3.result, maxLevel: r3.maxLevel },
    chain3: { result: r4.result, maxLevel: r4.maxLevel }
  }, 'edge-cases')

  return { partId }
}
