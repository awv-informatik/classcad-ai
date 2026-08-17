// Test subtraction from a compound solid (result of prior union)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubFromUnion' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Two boxes, union them
  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 60, height: 40
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 40, width: 60, height: 80,
    translation: [30, 0, 0]
  })).result

  await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })
  console.log('[10] union done, compound solid:', box1)

  await snapshot('after-union')

  // Now subtract a cylinder from the compound solid
  const cyl = (await api.v1.solid.cylinder({
    id: eifId, height: 100, diameter: 20,
    translation: [50, 30, -10]
  })).result

  const r = await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [cyl] })
  console.log('[10] subtraction from union — result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-subtract')

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'union-then-subtract')

  return { partId }
}
